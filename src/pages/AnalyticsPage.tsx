import { useCallback, useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertCircle, CalendarRange, CheckCircle2, ClipboardList, Filter, Users } from "lucide-react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { MetricStrip } from "@/components/admin/MetricStrip"
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
    <div className="space-y-6">
      <section className="bg-background rounded-2xl border border-border overflow-hidden">
        <div className="border-b border-border px-5 py-5 sm:px-6 lg:px-7">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Consulta</p>
              <h2 className="mt-1 text-2xl font-bold text-foreground tracking-tight">Vista general</h2>
              <p className="mt-1 text-sm text-muted-foreground">Selecciona una encuesta y revisa el comportamiento del período.</p>
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(260px,1fr),170px,170px,120px] xl:min-w-[780px]">
              <Select value={selectedSurveyId} onValueChange={applySurveySelection}>
                <SelectTrigger className="h-11 bg-background">
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

              <Input type="date" value={fechaInicio} onChange={(event) => setFechaInicio(event.target.value)} className="h-11 bg-background" />
              <Input type="date" value={fechaFin} onChange={(event) => setFechaFin(event.target.value)} className="h-11 bg-background" />
              <Button
                type="button"
                variant="outline"
                className="h-11"
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
            <div className="mt-5 flex flex-col gap-3 rounded-xl border border-border bg-muted/50 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full bg-primary text-primary-foreground">{selectedSurvey.estado}</Badge>
                  <span className="text-sm text-muted-foreground">{selectedSurvey.question_count ?? 0} preguntas</span>
                  <span className="text-sm text-muted-foreground">{selectedSurvey.response_count ?? 0} registros</span>
                </div>
                <h3 className="mt-2 break-words text-xl font-semibold text-foreground">{selectedSurvey.titulo}</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-foreground">{metrics.totalResponses} personas distintas en el filtro actual</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="p-5 sm:p-6 lg:p-7 space-y-6">
          <MetricStrip items={[
            {label: 'Personas', value: metrics.totalResponses, subtitle: 'Distintas en el filtro', icon: Users},
            {label: 'Días activos', value: metrics.activeDays, subtitle: 'Con registros', icon: CalendarRange},
            {label: 'Encuestas', value: metrics.uniqueSurveys, subtitle: 'Con actividad', icon: CheckCircle2},
            {label: 'Última respuesta', value: metrics.latestResponse, subtitle: 'Más reciente', icon: Users}
          ]} />

          <div className="grid gap-6 xl:grid-cols-[1.25fr,0.75fr]">
            <div className="rounded-2xl border bg-background">
              <div className="p-5 border-b">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-semibold text-foreground tracking-tight">Actividad por fecha</h4>
                    <p className="mt-1 text-sm text-muted-foreground">Vista rápida del movimiento dentro del filtro actual.</p>
                  </div>
                </div>
              </div>
              <div className="p-5 h-[280px]">
                  {dailySeries.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailySeries} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="etiqueta" tick={{ fill: "currentColor", fontSize: 12 }} axisLine={false} tickLine={false} className="text-muted-foreground" />
                        <YAxis tick={{ fill: "currentColor", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} className="text-muted-foreground" />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState message="No hay actividad dentro del filtro." />
                  )}
              </div>
            </div>

            <div className="rounded-2xl border bg-background">
              <div className="p-5 border-b">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-semibold text-foreground tracking-tight">Picos detectados</h4>
                    <p className="mt-1 text-sm text-muted-foreground">Días con participación fuera del habitual.</p>
                  </div>
                </div>
              </div>
              <div className="p-0">
                  {eventSuggestions.length ? (
                    <div className="divide-y">
                    {eventSuggestions.map((item) => (
                      <div key={item.fecha} className="p-4 table-row-hover">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-foreground">{item.fecha}</p>
                          <Badge variant="secondary" className="rounded-full">
                            {item.total}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{item.motivo}</p>
                      </div>
                    ))}
                    </div>
                  ) : (
                    <div className="p-5 h-full"><EmptyState message="No se detectaron picos en este rango." /></div>
                  )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background rounded-2xl border border-border overflow-hidden">
        <div className="border-b border-border px-5 py-5 sm:px-6 lg:px-7">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Preguntas</p>
              <h3 className="mt-1 text-2xl font-bold text-foreground tracking-tight">Análisis por pregunta</h3>
            </div>
            <div className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
              {questionSelectionCount} pregunta{questionSelectionCount === 1 ? "" : "s"} seleccionada{questionSelectionCount === 1 ? "" : "s"}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Cargando información…</div>
        ) : isEmpty ? (
          <div className="m-6"><EmptyState message="No hay respuestas para mostrar en la encuesta seleccionada." /></div>
        ) : (
          <div className="grid gap-0 xl:grid-cols-[300px,1fr]">
            <aside className="border-b border-border bg-muted/30 p-5 xl:border-b-0 xl:border-r xl:p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Filter className="h-4 w-4 text-primary" />
                Filtrar Preguntas
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Selecciona las preguntas que deseas incluir en el análisis.</p>
              <div className="mt-4 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setSelectedQuestionIds(questions.map((question) => question.id))}
                >
                  Todas
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setSelectedQuestionIds([])}
                >
                  Ninguna
                </Button>
              </div>

              <div className="mt-5 space-y-1">
                {questions.map((question) => {
                  const checked = selectedQuestionIds.includes(question.id)
                  return (
                    <label
                      key={question.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                        checked ? "bg-accent/10 text-accent-foreground" : "hover:bg-muted"
                      }`}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleQuestion(question.id)}
                        className="mt-0.5"
                      />
                      <div className="min-w-0">
                        <p className={`line-clamp-2 text-sm font-medium leading-tight ${checked ? "text-foreground" : "text-muted-foreground"}`}>{question.texto_pregunta}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-wider opacity-70">
                          {question.tipo_pregunta.replaceAll("_", " ")}
                        </p>
                      </div>
                    </label>
                  )
                })}
              </div>
            </aside>

            <div className="p-5 sm:p-6 lg:p-7 bg-background">
              {selectedQuestionCards.length ? (
                <div className="space-y-8">
                  {selectedQuestionCards.map((card) => (
                    <div key={card.question.id} className="fade-in">
                      <QuestionInsightsCard
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
                      <div className="my-8 border-b border-border last:hidden" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12"><EmptyState message="Selecciona una o más preguntas en el panel lateral para ver su análisis." /></div>
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar respuesta</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la respuesta seleccionada del análisis y del historial de la encuesta.
              {responseToDeleteName ? `\n\nRegistro: ${responseToDeleteName}` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
    <div className="flex h-full min-h-[160px] items-center justify-center rounded-2xl border border-dashed bg-muted/30 text-sm text-muted-foreground p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="p-3 bg-background rounded-full shadow-sm">
          <AlertCircle className="h-5 w-5 text-muted-foreground/60" />
        </div>
        <span>{message}</span>
      </div>
    </div>
  )
}
