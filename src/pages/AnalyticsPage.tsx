import { useCallback, useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertCircle, CalendarRange, CheckCircle2, ClipboardList, Filter, Users } from "lucide-react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { KpiCard } from "@/components/admin/KpiCard"
import { QuestionInsightsCard, type QuestionChartType } from "@/components/admin/QuestionInsightsCard"
import { ResponseDetailModal } from "@/components/admin/ResponseDetailModal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  buildAllQuestionAnalytics,
  buildDailySeries,
  buildDashboardMetrics,
  buildEventSuggestions,
  getRespondentName,
} from "@/lib/dashboardAnalytics"
import {
  deleteSurveyResponse,
  fetchDashboardQuestions,
  fetchDashboardResponses,
  fetchDashboardSurveys,
} from "@/services/dashboardService"
import { toast } from "sonner"
import { useSearchParams } from "react-router-dom"

export default function AnalyticsPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedSurveyId, setSelectedSurveyId] = useState(() => searchParams.get("survey") ?? "")
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(null)
  const [responseToDeleteId, setResponseToDeleteId] = useState<string | null>(null)
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([])
  const [questionChartTypes, setQuestionChartTypes] = useState<Record<string, QuestionChartType>>({})

  const surveysQuery = useQuery({
    queryKey: ["dashboard-surveys"],
    queryFn: fetchDashboardSurveys,
  })

  const applySurveySelection = useCallback(
    (surveyId: string, options?: { syncUrl?: boolean }) => {
      setSelectedSurveyId(surveyId)
      setSelectedQuestionIds([])
      setQuestionChartTypes({})
      setSelectedResponseId(null)
      setResponseToDeleteId(null)

      if (options?.syncUrl === false) return

      const next = new URLSearchParams(searchParams)
      next.delete("mode")
      next.set("survey", surveyId)
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  useEffect(() => {
    const routeSurveyId = searchParams.get("survey") ?? ""

    if (routeSurveyId) {
      if (routeSurveyId !== selectedSurveyId) {
        applySurveySelection(routeSurveyId, { syncUrl: false })
      }
      return
    }

    if (!selectedSurveyId && surveysQuery.data?.length) {
      applySurveySelection(surveysQuery.data[0].id)
    }
  }, [applySurveySelection, searchParams, selectedSurveyId, surveysQuery.data])

  const questionsQuery = useQuery({
    queryKey: ["dashboard-questions", selectedSurveyId],
    queryFn: () => fetchDashboardQuestions(selectedSurveyId),
    enabled: Boolean(selectedSurveyId),
  })

  const responsesQuery = useQuery({
    queryKey: ["dashboard-responses", selectedSurveyId, fechaInicio, fechaFin],
    queryFn: () =>
      fetchDashboardResponses({
        encuestaId: selectedSurveyId,
        fechaInicio: fechaInicio || undefined,
        fechaFin: fechaFin || undefined,
      }),
    enabled: Boolean(selectedSurveyId),
  })

  const deleteResponseMutation = useMutation({
    mutationFn: deleteSurveyResponse,
    onSuccess: async () => {
      toast.success("Respuesta eliminada")
      setSelectedResponseId(null)
      await queryClient.invalidateQueries({ queryKey: ["dashboard-responses", selectedSurveyId] })
      await queryClient.invalidateQueries({ queryKey: ["dashboard-responses"] })
      await queryClient.invalidateQueries({ queryKey: ["dashboard-surveys"] })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "No se pudo eliminar la respuesta"
      toast.error(message)
    },
  })

  const selectedSurvey = useMemo(
    () => surveysQuery.data?.find((survey) => survey.id === selectedSurveyId),
    [selectedSurveyId, surveysQuery.data]
  )

  const responses = responsesQuery.data ?? []
  const questions = questionsQuery.data ?? []
  const metrics = useMemo(() => buildDashboardMetrics(responses, questions), [responses, questions])
  const dailySeries = useMemo(() => buildDailySeries(responses), [responses])
  const eventSuggestions = useMemo(() => buildEventSuggestions(responses), [responses])
  const allQuestionCards = useMemo(() => buildAllQuestionAnalytics(responses, questions), [responses, questions])

  useEffect(() => {
    if (!questions.length) {
      setSelectedQuestionIds([])
      setQuestionChartTypes({})
      return
    }

    setSelectedQuestionIds((current) => {
      const validIds = current.filter((id) => questions.some((question) => question.id === id))
      if (validIds.length) return validIds
      return questions.slice(0, Math.min(3, questions.length)).map((question) => question.id)
    })

    setQuestionChartTypes((current) => {
      const next = { ...current }
      questions.forEach((question) => {
        if (!next[question.id]) next[question.id] = "barras"
      })
      return next
    })
  }, [questions])

  const selectedQuestionCards = useMemo(
    () => allQuestionCards.filter((card) => selectedQuestionIds.includes(card.question.id)),
    [allQuestionCards, selectedQuestionIds]
  )

  const selectedResponse = responses.find((response) => response.id === selectedResponseId)
  const responseToDelete = responses.find((response) => response.id === responseToDeleteId)
  const responseToDeleteName = responseToDelete ? getRespondentName(responseToDelete, questions) : "Respuesta seleccionada"
  const isLoading = surveysQuery.isLoading || questionsQuery.isLoading || responsesQuery.isLoading
  const isEmpty = !isLoading && selectedSurveyId && allQuestionCards.length === 0
  const questionSelectionCount = selectedQuestionIds.length

  const toggleQuestion = (questionId: string) => {
    setSelectedQuestionIds((current) =>
      current.includes(questionId) ? current.filter((id) => id !== questionId) : [...current, questionId]
    )
  }

  const handleDeleteResponse = (responseId: string) => {
    setResponseToDeleteId(responseId)
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden border border-[#e7dfd2] bg-white">
        <div className="border-b border-[#ece4d8] px-5 py-5 sm:px-6 lg:px-7">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="acaro-section-title">Consulta</p>
              <h2 className="mt-1 text-2xl font-semibold text-[#3d3025]">Vista general</h2>
              <p className="mt-1 text-sm text-[#8b8177]">Selecciona una encuesta y revisa el comportamiento del período.</p>
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(260px,1fr),170px,170px,120px] xl:min-w-[780px]">
              <Select value={selectedSurveyId} onValueChange={applySurveySelection}>
                <SelectTrigger className="h-11 border-[#e2dbcf] bg-white">
                  <SelectValue placeholder="Selecciona una encuesta" />
                </SelectTrigger>
                <SelectContent>
                  {(surveysQuery.data ?? []).map((survey) => (
                    <SelectItem key={survey.id} value={survey.id}>
                      {survey.titulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input type="date" value={fechaInicio} onChange={(event) => setFechaInicio(event.target.value)} className="h-11 border-[#e2dbcf] bg-white" />
              <Input type="date" value={fechaFin} onChange={(event) => setFechaFin(event.target.value)} className="h-11 border-[#e2dbcf] bg-white" />
              <Button
                type="button"
                variant="outline"
                className="h-11 border-[#e2dbcf] text-[#3d3025]"
                onClick={() => {
                  setFechaInicio("")
                  setFechaFin("")
                }}
              >
                Limpiar
              </Button>
            </div>
          </div>

          {selectedSurvey ? (
            <div className="mt-5 flex flex-col gap-3 border border-[#ece4d8] bg-[#fcfbf8] px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full bg-[#2f6f35] text-white hover:bg-[#2f6f35]">{selectedSurvey.estado}</Badge>
                  <span className="text-sm text-[#6d665d]">{selectedSurvey.question_count ?? 0} preguntas</span>
                  <span className="text-sm text-[#6d665d]">{selectedSurvey.response_count ?? 0} registros</span>
                </div>
                <h3 className="mt-2 break-words text-2xl font-semibold text-[#3d3025]">{selectedSurvey.titulo}</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-[#6b5846]">{metrics.totalResponses} personas distintas en el filtro actual</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="p-5 sm:p-6 lg:p-7">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard title="Personas" value={metrics.totalResponses} subtitle="Distintas en el filtro" icon={ClipboardList} />
            <KpiCard title="Días activos" value={metrics.activeDays} subtitle="Con registros" icon={CalendarRange} />
            <KpiCard title="Encuestas" value={metrics.uniqueSurveys} subtitle="Con actividad" icon={CheckCircle2} />
            <KpiCard title="Última respuesta" value={metrics.latestResponse} subtitle="Más reciente" icon={Users} />
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.25fr,0.75fr]">
            <Card className="border-[#e0d4c4] bg-white shadow-none">
              <CardContent className="p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-semibold text-[#3d3025]">Actividad por fecha</h4>
                    <p className="mt-1 text-sm text-[#8b8177]">Vista rápida del movimiento dentro del filtro actual.</p>
                  </div>
                  <div className="acaro-chip">Barras</div>
                </div>
                <div className="h-[220px]">
                  {dailySeries.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailySeries} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ebe4d9" />
                        <XAxis dataKey="etiqueta" tick={{ fill: "#7a6654", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#7a6654", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="total" fill="#2f6f35" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState message="No hay actividad dentro del filtro." />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#e0d4c4] bg-white shadow-none">
              <CardContent className="p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-semibold text-[#3d3025]">Picos detectados</h4>
                    <p className="mt-1 text-sm text-[#8b8177]">Días con participación fuera del comportamiento habitual.</p>
                  </div>
                  <div className="acaro-chip">Resumen</div>
                </div>
                <div className="space-y-3">
                  {eventSuggestions.length ? (
                    eventSuggestions.map((item) => (
                      <div key={item.fecha} className="border border-[#ebe4d9] bg-[#fcfaf5] px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-[#3d3025]">{item.fecha}</p>
                          <Badge variant="secondary" className="rounded-full bg-white text-[#6d665d]">
                            {item.total}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-[#6d665d]">{item.motivo}</p>
                      </div>
                    ))
                  ) : (
                    <EmptyState message="No se detectaron picos en este rango." />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="overflow-hidden border border-[#e7dfd2] bg-white">
        <div className="border-b border-[#ece4d8] px-5 py-5 sm:px-6 lg:px-7">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="acaro-section-title">Preguntas</p>
              <h3 className="mt-1 text-2xl font-semibold text-[#3d3025]">Análisis por pregunta</h3>
            </div>
            <div className="text-sm text-[#6b5846]">
              {questionSelectionCount} pregunta{questionSelectionCount === 1 ? "" : "s"} marcada{questionSelectionCount === 1 ? "" : "s"}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-sm text-[#6d665d]">Cargando información…</div>
        ) : isEmpty ? (
          <div className="m-6 border border-dashed border-[#e2dbcf] bg-[#fcfbf8] p-6 text-sm text-[#6d665d]">
            No hay respuestas para mostrar en la encuesta seleccionada.
          </div>
        ) : (
          <div className="grid gap-0 xl:grid-cols-[280px,1fr]">
            <aside className="border-b border-[#ebe4d9] bg-[#fcfbf8] p-5 xl:border-b-0 xl:border-r xl:p-6">
              <div className="flex items-center gap-2 text-sm font-medium text-[#6d665d]">
                <Filter className="h-4 w-4 text-[#2f6f35]" />
                Preguntas a revisar
              </div>
              <p className="mt-2 text-sm text-[#8b8177]">Marca solo las preguntas que quieras revisar. Cada bloque permite cambiar su tipo de gráfico.</p>
              <div className="mt-4 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 border-[#e2dbcf] text-[#3d3025]"
                  onClick={() => setSelectedQuestionIds(questions.map((question) => question.id))}
                >
                  Marcar todo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 border-[#e2dbcf] text-[#3d3025]"
                  onClick={() => setSelectedQuestionIds([])}
                >
                  Limpiar
                </Button>
              </div>

              <div className="mt-4 max-h-[620px] space-y-2 overflow-y-auto pr-1">
                {questions.map((question) => {
                  const checked = selectedQuestionIds.includes(question.id)
                  return (
                    <label
                      key={question.id}
                      className={`flex cursor-pointer items-start gap-3 border px-4 py-3 transition ${
                        checked ? "border-[#c9b095] bg-white" : "border-transparent bg-transparent hover:border-[#ebe4d9] hover:bg-white/70"
                      }`}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleQuestion(question.id)}
                        className="mt-0.5 h-5 w-5 rounded-md"
                      />
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm font-semibold leading-6 text-[#3d3025]">{question.texto_pregunta}</p>
                        <p className="mt-1 text-xs text-[#8b8177]">
                          {question.tipo_pregunta.replaceAll("_", " ")}
                          {question.es_obligatoria ? " · obligatoria" : ""}
                        </p>
                      </div>
                    </label>
                  )
                })}
              </div>
            </aside>

            <div className="p-5 sm:p-6 lg:p-7">
              {selectedQuestionCards.length ? (
                <div className="space-y-4">
                  {selectedQuestionCards.map((card) => (
                    <QuestionInsightsCard
                      key={card.question.id}
                      data={card}
                      chartType={questionChartTypes[card.question.id] ?? "barras"}
                      onChartTypeChange={(value) =>
                        setQuestionChartTypes((current) => ({
                          ...current,
                          [card.question.id]: value,
                        }))
                      }
                      onOpenResponse={setSelectedResponseId}
                      onDeleteResponse={handleDeleteResponse}
                      deletingResponseId={deleteResponseMutation.isPending ? deleteResponseMutation.variables : null}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState message="Marca una o más preguntas para ver su análisis." />
              )}
            </div>
          </div>
        )}
      </section>

      <ResponseDetailModal
        open={Boolean(selectedResponseId)}
        onOpenChange={(open) => {
          if (!open) setSelectedResponseId(null)
        }}
        response={selectedResponse}
        questions={questions}
        onDeleteResponse={handleDeleteResponse}
        deleting={deleteResponseMutation.isPending && deleteResponseMutation.variables === selectedResponse?.id}
      />

      <AlertDialog
        open={Boolean(responseToDeleteId)}
        onOpenChange={(open) => {
          if (!open) setResponseToDeleteId(null)
        }}
      >
        <AlertDialogContent className="max-w-md border-[#e0d4c4] bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#3d3025]">Eliminar respuesta</AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-6 text-[#6d665d]">
              Se eliminará la respuesta seleccionada del análisis y del historial de la encuesta.
              {responseToDeleteName ? `

Registro: ${responseToDeleteName}` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#e2dbcf] text-[#3d3025]">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#9a5b42] text-white hover:bg-[#7a4a2b]"
              onClick={(event) => {
                event.preventDefault()
                if (!responseToDeleteId) return
                deleteResponseMutation.mutate(responseToDeleteId, {
                  onSuccess: () => {
                    setResponseToDeleteId(null)
                  },
                })
              }}
              disabled={deleteResponseMutation.isPending}
            >
              {deleteResponseMutation.isPending ? "Eliminando..." : "Confirmar eliminación"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-[100px] items-center justify-center border border-dashed border-[#e2dbcf] bg-[#fcfbf8] text-sm text-[#6d665d]">
      <div className="flex items-center gap-2 px-4 text-center">
        <AlertCircle className="h-4 w-4 text-[#8b8177]" />
        <span>{message}</span>
      </div>
    </div>
  )
}
