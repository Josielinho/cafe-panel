import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useSearchParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ClipboardPlus,
  Copy,
  FilePenLine,
  ListOrdered,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { deleteSurvey, fetchDashboardSurveys, fetchSurveyEditor, saveSurveyEditor } from "@/services/dashboardService"
import type { DashboardSurvey, SurveyEditorData, SurveyQuestionForm } from "@/types/dashboardTypes"

const questionTypeOptions = [
  { value: "texto_corto", label: "Texto corto" },
  { value: "texto_largo", label: "Texto largo" },
  { value: "numero", label: "Número" },
  { value: "booleano", label: "Sí / No" },
  { value: "opcion_unica", label: "Selección única" },
  { value: "opcion_multiple", label: "Selección múltiple" },
] as const

const builderSteps = [
  { id: 1, title: "Datos generales", icon: FilePenLine },
  { id: 2, title: "Preguntas", icon: ListOrdered },
  { id: 3, title: "Revisión", icon: CheckCircle2 },
] as const

function createEmptyQuestion(index: number): SurveyQuestionForm {
  return {
    codigo_pregunta: `P${String(index + 1).padStart(2, "0")}`,
    texto_pregunta: "",
    tipo_pregunta: "texto_corto",
    es_obligatoria: false,
    opciones: [],
  }
}

function createEmptySurvey(): SurveyEditorData {
  return {
    titulo: "",
    descripcion: "",
    estado: "borrador",
    logo_url: "",
    questions: [createEmptyQuestion(0)],
  }
}

function normalizeQuestions(questions: SurveyQuestionForm[]) {
  return questions.map((question, index) => ({
    ...question,
    codigo_pregunta: question.codigo_pregunta?.trim() || `P${String(index + 1).padStart(2, "0")}`,
    texto_pregunta: question.texto_pregunta.trim(),
    opciones: question.opciones.map((option, optionIndex) => ({
      ...option,
      posicion: optionIndex + 1,
      valor_opcion: option.valor_opcion.trim(),
      etiqueta_opcion: option.etiqueta_opcion.trim(),
    })),
  }))
}

function validateEditor(editor: SurveyEditorData) {
  const issues: string[] = []
  const title = editor.titulo.trim()
  const questions = normalizeQuestions(editor.questions)

  if (!title) issues.push("Agrega el título de la encuesta.")
  if (!questions.length) issues.push("Agrega al menos una pregunta.")

  questions.forEach((question, index) => {
    if (!question.texto_pregunta) issues.push(`La pregunta ${index + 1} no tiene enunciado.`)

    if ((question.tipo_pregunta === "opcion_unica" || question.tipo_pregunta === "opcion_multiple") && question.opciones.length < 2) {
      issues.push(`La pregunta ${index + 1} necesita al menos dos opciones.`)
    }

    if (question.tipo_pregunta === "opcion_unica" || question.tipo_pregunta === "opcion_multiple") {
      question.opciones.forEach((option, optionIndex) => {
        if (!option.etiqueta_opcion) issues.push(`La opción ${optionIndex + 1} de la pregunta ${index + 1} no tiene texto visible.`)
        if (!option.valor_opcion) issues.push(`La opción ${optionIndex + 1} de la pregunta ${index + 1} no tiene valor interno.`)
      })
    }
  })

  return issues
}

function formatStatusLabel(status: string) {
  return status === "publicada" ? "Publicada" : "Borrador"
}

function formatRecordCount(count: number) {
  return `${count} ${count === 1 ? "registro" : "registros"}`
}

export default function SurveysPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState("")
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null)
  const [editor, setEditor] = useState<SurveyEditorData>(createEmptySurvey())
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [deleteChecklistChecked, setDeleteChecklistChecked] = useState(false)

  const routeSurveyId = searchParams.get("survey")
  const routeMode = searchParams.get("mode")

  const surveysQuery = useQuery({
    queryKey: ["dashboard-surveys"],
    queryFn: fetchDashboardSurveys,
  })

  const surveyEditorQuery = useQuery({
    queryKey: ["survey-editor", selectedSurveyId],
    queryFn: () => fetchSurveyEditor(selectedSurveyId as string),
    enabled: Boolean(selectedSurveyId) && !isCreatingNew,
  })

  useEffect(() => {
    if (routeMode === "create") {
      if (!isCreatingNew) {
        setIsCreatingNew(true)
        setSelectedSurveyId(null)
        setEditor(createEmptySurvey())
        setActiveStep(1)
      }
      return
    }

    if (routeSurveyId) {
      if (isCreatingNew) setIsCreatingNew(false)
      if (selectedSurveyId !== routeSurveyId) {
        setSelectedSurveyId(routeSurveyId)
        setEditor(createEmptySurvey())
        setActiveStep(1)
      }
      return
    }

    if (surveysQuery.data?.length) {
      setSearchParams({ survey: surveysQuery.data[0].id }, { replace: true })
    }
  }, [isCreatingNew, routeMode, routeSurveyId, selectedSurveyId, setSearchParams, surveysQuery.data])

  useEffect(() => {
    if (surveyEditorQuery.data && !isCreatingNew) setEditor(surveyEditorQuery.data)
  }, [isCreatingNew, surveyEditorQuery.data])

  const filteredSurveys = useMemo(() => {
    const term = search.trim().toLowerCase()
    const list = surveysQuery.data ?? []
    if (!term) return list
    return list.filter((survey) => `${survey.titulo} ${survey.descripcion ?? ""}`.toLowerCase().includes(term))
  }, [search, surveysQuery.data])

  const responseCount = editor.response_count ?? 0
  const totalQuestions = editor.questions.length
  const totalOptions = editor.questions.reduce((acc, question) => acc + question.opciones.length, 0)
  const surveyIssues = validateEditor(editor)
  const canAdvanceToReview = !surveyIssues.length
  const deleteReady = deleteConfirmText.trim().toLowerCase() === "borrar encuesta" && deleteChecklistChecked
  const selectedSurvey = (surveysQuery.data ?? []).find((survey) => survey.id === selectedSurveyId)
  const searchResults = search.trim() ? filteredSurveys.slice(0, 6) : []
  const isEditorLoading = Boolean(selectedSurveyId) && !isCreatingNew && surveyEditorQuery.isLoading
  const headerTitle = isCreatingNew
    ? editor.titulo.trim() || "Nueva encuesta"
    : isEditorLoading
      ? selectedSurvey?.titulo || "Cargando encuesta"
      : editor.titulo.trim() || selectedSurvey?.titulo || "Encuesta"
  const headerDescription = isCreatingNew
    ? editor.descripcion.trim() || "Completa la estructura y guarda la encuesta."
    : isEditorLoading
      ? selectedSurvey?.descripcion?.trim() || "Cargando información de la encuesta."
      : editor.descripcion.trim() || selectedSurvey?.descripcion?.trim() || "Completa la estructura y guarda la encuesta."

  const openExistingSurvey = (surveyId: string) => {
    setSearch("")
    setIsCreatingNew(false)
    setSelectedSurveyId(surveyId)
    setEditor(createEmptySurvey())
    setActiveStep(1)
    setSearchParams({ survey: surveyId }, { replace: true })
  }

  const startNewSurvey = () => {
    setSearch("")
    setIsCreatingNew(true)
    setSelectedSurveyId(null)
    setEditor(createEmptySurvey())
    setActiveStep(1)
    setSearchParams({ mode: "create" }, { replace: true })
  }

  const addQuestion = () => {
    setEditor((current) => ({
      ...current,
      questions: [...current.questions, createEmptyQuestion(current.questions.length)],
    }))
  }

  const duplicateQuestion = (index: number) => {
    setEditor((current) => {
      const target = current.questions[index]
      if (!target) return current
      const duplicate: SurveyQuestionForm = {
        ...target,
        id: undefined,
        codigo_pregunta: `P${String(current.questions.length + 1).padStart(2, "0")}`,
        texto_pregunta: `${target.texto_pregunta} (copia)`.trim(),
        opciones: target.opciones.map((option, optionIndex) => ({
          ...option,
          id: undefined,
          posicion: optionIndex + 1,
        })),
      }
      const updated = [...current.questions]
      updated.splice(index + 1, 0, duplicate)
      return {
        ...current,
        questions: updated.map((question, questionIndex) => ({
          ...question,
          codigo_pregunta: question.codigo_pregunta || `P${String(questionIndex + 1).padStart(2, "0")}`,
        })),
      }
    })
    toast.success("Pregunta duplicada")
  }

  const saveMutation = useMutation({
    mutationFn: saveSurveyEditor,
    onSuccess: async (encuestaId) => {
      toast.success("Encuesta guardada correctamente")
      await queryClient.invalidateQueries({ queryKey: ["dashboard-surveys"] })
      await queryClient.invalidateQueries({ queryKey: ["survey-editor", encuestaId] })
      setIsCreatingNew(false)
      setSelectedSurveyId(encuestaId)
      setSearchParams({ survey: encuestaId }, { replace: true })
      setActiveStep(3)
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "No se pudo guardar la encuesta"
      toast.error(message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: ({ surveyId, confirmed }: { surveyId: string; confirmed: boolean }) => deleteSurvey(surveyId, { confirmed }),
    onSuccess: async () => {
      toast.success("Encuesta eliminada")
      setSelectedSurveyId(null)
      setIsCreatingNew(false)
      setEditor(createEmptySurvey())
      setActiveStep(1)
      setDeleteConfirmText("")
      setDeleteChecklistChecked(false)
      setIsDeleteDialogOpen(false)
      setSearchParams({}, { replace: true })
      await queryClient.invalidateQueries({ queryKey: ["dashboard-surveys"] })
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "No se pudo eliminar la encuesta"
      toast.error(message)
    },
  })

  const handleSave = (statusOverride?: SurveyEditorData["estado"]) => {
    const normalizedEditor: SurveyEditorData = {
      ...editor,
      titulo: editor.titulo.trim(),
      descripcion: editor.descripcion.trim(),
      logo_url: editor.logo_url?.trim() ?? "",
      estado: statusOverride ?? editor.estado,
      questions: normalizeQuestions(editor.questions),
    }

    const issues = validateEditor(normalizedEditor)
    if (issues.length) {
      toast.error(issues[0])
      return
    }

    saveMutation.mutate(normalizedEditor)
  }

  return (
    <>
      <Card className="overflow-hidden rounded-[18px] border-[#e8dfd4] bg-white shadow-none">
        <CardContent className="p-0">
          <section className="border-b border-[#ece6db] px-5 py-5 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-sm text-[#6d665d]">
                  <Badge className={editor.estado === "publicada" ? "rounded-full bg-[#edf5ee] text-[#2f6f35] hover:bg-[#edf5ee]" : "rounded-full bg-[#f5f1e6] text-[#8b6d34] hover:bg-[#f5f1e6]"}>
                    {formatStatusLabel(editor.estado)}
                  </Badge>
                  <span>{editor.questions.length} preguntas</span>
                  <span>•</span>
                  <span>{totalOptions} opciones</span>
                  <span>•</span>
                  <span>{formatRecordCount(responseCount)}</span>
                </div>
                <h2 className="mt-3 max-w-5xl break-words text-[2rem] font-semibold leading-tight text-[#3d3025] sm:text-[2.25rem]">
                  {headerTitle}
                </h2>
                <p className="mt-2 max-w-4xl text-sm leading-6 text-[#6d665d]">
                  {headerDescription}
                </p>
              </div>

              <div className="flex w-full max-w-[560px] flex-col gap-3 xl:items-end">
                <div className="relative w-full">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b8177]" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar encuesta"
                    className="h-12 rounded-[14px] border-[#ded7cb] bg-white pl-11"
                  />

                  {searchResults.length ? (
                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-[14px] border border-[#ebe4d9] bg-white shadow-[0_12px_32px_rgba(80,59,39,0.08)]">
                      {searchResults.map((survey) => (
                        <button
                          key={survey.id}
                          type="button"
                          onClick={() => openExistingSurvey(survey.id)}
                          className="flex w-full items-center justify-between gap-3 border-b border-[#f0e9df] px-4 py-3 text-left last:border-b-0 hover:bg-[#fbf8f3]"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#3d3025]">{survey.titulo}</p>
                            <p className="mt-1 text-xs text-[#7f756b]">{formatStatusLabel(survey.estado)} · {survey.question_count ?? 0} preguntas</p>
                          </div>
                          <span className="text-xs text-[#8b8177]">{formatRecordCount(survey.response_count ?? 0)}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="flex w-full flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-[#6d665d]">{selectedSurveyId ? "Modo edición" : "Modo creación"}</div>
                  <div className="flex flex-wrap items-center gap-3">
                    {editor.id ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 rounded-[14px] border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                        onClick={() => setIsDeleteDialogOpen(true)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </Button>
                    ) : null}
                    <Button type="button" className="h-11 rounded-[14px]" onClick={startNewSurvey}>
                      <Plus className="mr-2 h-4 w-4" />
                      Nueva encuesta
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section className="border-b border-[#eee6dc] px-5 py-4 sm:px-6 lg:px-8">
            <div className="grid gap-3 md:grid-cols-3">
              {builderSteps.map((step) => (
                <StepTab
                  key={step.id}
                  step={step.id}
                  title={step.title}
                  isActive={activeStep === step.id}
                  isComplete={step.id < activeStep}
                  onClick={() => {
                    if (step.id === 3 && !canAdvanceToReview) {
                      toast.error("Completa los campos pendientes antes de revisar.")
                      return
                    }
                    setActiveStep(step.id as 1 | 2 | 3)
                  }}
                />
              ))}
            </div>
          </section>

          <section className="p-5 sm:p-6 lg:p-8">
            {isEditorLoading ? (
              <div className="rounded-[22px] border border-[#e7dfd2] bg-[#fcfbf8] px-6 py-12 text-center text-sm text-[#6d665d]">
                Cargando encuesta seleccionada…
              </div>
            ) : (
              <>
                {activeStep === 1 ? <GeneralInfoStep editor={editor} onChange={setEditor} onNext={() => setActiveStep(2)} /> : null}

                {activeStep === 2 ? (
                  <QuestionsStep
                    editor={editor}
                    setEditor={setEditor}
                    onBack={() => setActiveStep(1)}
                    onNext={() => {
                      const issues = validateEditor(editor)
                      if (issues.length) {
                        toast.error(issues[0])
                        return
                      }
                      setActiveStep(3)
                    }}
                    onAddQuestion={addQuestion}
                    onDuplicateQuestion={duplicateQuestion}
                  />
                ) : null}

                {activeStep === 3 ? (
                  <ReviewStep
                    editor={editor}
                    issues={surveyIssues}
                    isSaving={saveMutation.isPending}
                    onBack={() => setActiveStep(2)}
                    onSaveDraft={() => handleSave("borrador")}
                    onPublish={() => handleSave("publicada")}
                    onEditBasics={() => setActiveStep(1)}
                    onEditQuestions={() => setActiveStep(2)}
                  />
                ) : null}
              </>
            )}
          </section>
        </CardContent>
      </Card>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-xl overflow-hidden rounded-[22px] border-[#e2dbcf] p-0">
          <div className="bg-red-50 px-6 py-5">
            <DialogHeader>
              <DialogTitle className="text-xl text-red-950">Eliminar encuesta</DialogTitle>
              <DialogDescription className="mt-2 text-sm leading-6 text-red-900/80">
                Esta acción eliminará la encuesta, sus preguntas y todas las respuestas asociadas.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="space-y-5 px-6 py-6">
            <div className="rounded-[18px] border border-[#e2dbcf] bg-[#faf8f3] p-4 text-sm text-[#6b5b45]">
              <p className="font-semibold text-[#3d3025]">Verificación requerida</p>
              <p className="mt-2 leading-6">
                Escribe <span className="font-semibold">borrar encuesta</span> y marca la casilla para habilitar la eliminación.
              </p>
            </div>

            <Field label='Escribe "borrar encuesta"'>
              <Input
                value={deleteConfirmText}
                onChange={(event) => setDeleteConfirmText(event.target.value)}
                placeholder="borrar encuesta"
                className="h-12 rounded-[14px] border-[#e2dbcf] bg-[#faf8f3]"
              />
            </Field>

            <label className="flex items-start gap-3 rounded-[18px] border border-[#e2dbcf] bg-white p-4">
              <Checkbox
                checked={deleteChecklistChecked}
                onCheckedChange={(checked) => setDeleteChecklistChecked(Boolean(checked))}
                className="mt-1 h-5 w-5 rounded-md"
              />
              <div>
                <p className="font-medium text-[#3d3025]">Entiendo que esta acción borra el historial de esta encuesta.</p>
                <p className="mt-1 text-sm leading-6 text-[#6d665d]">No se podrá recuperar desde el panel una vez confirmada.</p>
              </div>
            </label>
          </div>
          <DialogFooter className="border-t border-[#e2dbcf] px-6 py-4">
            <Button type="button" variant="outline" className="rounded-[14px]" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-[14px]"
              disabled={!deleteReady || deleteMutation.isPending || !editor.id}
              onClick={() => {
                if (!editor.id) return
                deleteMutation.mutate({ surveyId: editor.id, confirmed: true })
              }}
            >
              Eliminar definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function MetricCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[14px] border border-[#ebe4d9] bg-[#fbfaf7] px-4 py-4">
      <p className="acaro-section-title">{label}</p>
      <p className="mt-2 text-4xl font-semibold leading-none text-[#3d3025]">{value}</p>
    </div>
  )
}

function SurveyCompactCard({
  survey,
  isSelected,
  isNew,
  onClick,
}: {
  survey?: DashboardSurvey
  isSelected: boolean
  isNew?: boolean
  onClick: () => void
}) {
  if (isNew) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-full rounded-[16px] border px-4 py-4 text-left transition ${
          isSelected
            ? "border-[#2f6f35] bg-[#eef5ee] text-[#22562d]"
            : "border-dashed border-[#d7ccba] bg-white text-[#3d3025] hover:border-[#c6b391]"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`rounded-[12px] p-2 ${isSelected ? "bg-white/10" : "bg-[#faf8f3]"}`}>
            <ClipboardPlus className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold">Nueva encuesta</p>
            <p className={`mt-1 text-sm ${isSelected ? "text-[#6f5f48]" : "text-[#6d665d]"}`}>Crear desde cero</p>
          </div>
        </div>
      </button>
    )
  }

  if (!survey) return null

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-[16px] border px-4 py-4 text-left transition ${
        isSelected
          ? "border-[#c4a14e] bg-[#f7f2e6] text-[#3d3025] shadow-sm"
          : "border-[#e2dbcf] bg-white hover:border-[#cdb79d] hover:bg-[#fdfbf7]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              className={`rounded-full ${
                isSelected
                  ? "bg-white text-[#3d3025] hover:bg-white"
                  : survey.estado === "publicada"
                    ? "bg-[#d9eadc] text-[#2f5b3a] hover:bg-[#d9eadc]"
                    : "bg-[#f1e8da] text-[#6b5b45] hover:bg-[#f1e8da]"
              }`}
            >
              {formatStatusLabel(survey.estado)}
            </Badge>
            <span className={`text-xs ${isSelected ? "text-[#6f5f48]" : "text-[#6d665d]"}`}>{survey.question_count ?? 0} preg.</span>
          </div>
          <p className="mt-2 line-clamp-2 break-words text-base font-semibold leading-6">{survey.titulo}</p>
          <p className={`mt-1 line-clamp-2 text-sm leading-5 ${isSelected ? "text-[#6f5f48]" : "text-[#6d665d]"}`}>
            {survey.descripcion?.trim() || "Sin descripción"}
          </p>
        </div>
        <span className={`shrink-0 text-xs font-medium ${isSelected ? "text-[#8b6d34]" : "text-[#8b8177]"}`}>
          {formatRecordCount(survey.response_count ?? 0)}
        </span>
      </div>
    </button>
  )
}

function GeneralInfoStep({
  editor,
  onChange,
  onNext,
}: {
  editor: SurveyEditorData
  onChange: (value: SurveyEditorData | ((current: SurveyEditorData) => SurveyEditorData)) => void
  onNext: () => void
}) {
  return (
    <div className="space-y-6">
      <section className="grid gap-5 lg:grid-cols-2">
        <Field label="Título de la encuesta">
          <Input
            value={editor.titulo}
            onChange={(event) => onChange((current) => ({ ...current, titulo: event.target.value }))}
            placeholder="Ejemplo: Encuesta de satisfacción"
            className="h-12 rounded-2xl border-[#e2dbcf] bg-white"
          />
        </Field>
        <Field label="Estado">
          <Select value={editor.estado} onValueChange={(value: "borrador" | "publicada") => onChange((current) => ({ ...current, estado: value }))}>
            <SelectTrigger className="h-12 rounded-2xl border-[#e2dbcf] bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="borrador">Borrador</SelectItem>
              <SelectItem value="publicada">Publicada</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field label="Descripción" className="lg:col-span-2">
          <Textarea
            value={editor.descripcion}
            onChange={(event) => onChange((current) => ({ ...current, descripcion: event.target.value }))}
            placeholder="Describe el objetivo de la encuesta"
            className="min-h-[140px] rounded-2xl border-[#e2dbcf] bg-white"
          />
        </Field>

        <Field label="Logo o imagen (opcional)" className="lg:col-span-2">
          <Input
            value={editor.logo_url ?? ""}
            onChange={(event) => onChange((current) => ({ ...current, logo_url: event.target.value }))}
            placeholder="Pega aquí la URL del logo"
            className="h-12 rounded-2xl border-[#e2dbcf] bg-white"
          />
        </Field>
      </section>

      <div className="flex justify-end border-t border-[#e2dbcf] pt-6">
        <Button type="button" className="rounded-2xl" onClick={onNext}>
          Continuar
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function QuestionsStep({
  editor,
  setEditor,
  onBack,
  onNext,
  onAddQuestion,
  onDuplicateQuestion,
}: {
  editor: SurveyEditorData
  setEditor: (value: SurveyEditorData | ((current: SurveyEditorData) => SurveyEditorData)) => void
  onBack: () => void
  onNext: () => void
  onAddQuestion: () => void
  onDuplicateQuestion: (index: number) => void
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[#3d3025]">Preguntas</h2>
          <p className="mt-1 text-sm text-[#6d665d]">Agrega y organiza la estructura de la encuesta.</p>
        </div>
        <Button type="button" variant="outline" className="rounded-2xl" onClick={onAddQuestion}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar pregunta
        </Button>
      </div>

      <section className="space-y-5">
        {editor.questions.map((question, index) => (
          <QuestionCard
            key={question.id ?? `question-${index}`}
            question={question}
            index={index}
            onChange={(value) =>
              setEditor((current) => ({
                ...current,
                questions: current.questions.map((item, itemIndex) => (itemIndex === index ? value : item)),
              }))
            }
            onRemove={() =>
              setEditor((current) => ({
                ...current,
                questions:
                  current.questions.length === 1
                    ? [createEmptyQuestion(0)]
                    : current.questions.filter((_, itemIndex) => itemIndex !== index).map((item, itemIndex) => ({
                        ...item,
                        codigo_pregunta: item.codigo_pregunta || `P${String(itemIndex + 1).padStart(2, "0")}`,
                      })),
              }))
            }
            onDuplicate={() => onDuplicateQuestion(index)}
          />
        ))}
      </section>

      <div className="rounded-[24px] border border-dashed border-[#cdb79d] bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-semibold text-[#3d3025]">Agregar más preguntas</p>
            <p className="mt-1 text-sm text-[#6d665d]">Usa este botón para seguir construyendo la encuesta.</p>
          </div>
          <Button type="button" className="rounded-2xl" onClick={onAddQuestion}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar otra pregunta
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap justify-between gap-3 border-t border-[#e2dbcf] pt-6">
        <Button type="button" variant="outline" className="rounded-2xl" onClick={onBack}>
          Volver
        </Button>
        <Button type="button" className="rounded-2xl" onClick={onNext}>
          Revisar
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function ReviewStep({
  editor,
  issues,
  isSaving,
  onBack,
  onSaveDraft,
  onPublish,
  onEditBasics,
  onEditQuestions,
}: {
  editor: SurveyEditorData
  issues: string[]
  isSaving: boolean
  onBack: () => void
  onSaveDraft: () => void
  onPublish: () => void
  onEditBasics: () => void
  onEditQuestions: () => void
}) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-2">
        <ReviewCard title="Datos generales" action="Editar" onClick={onEditBasics}>
          <ReviewLine label="Título" value={editor.titulo || "Pendiente"} />
          <ReviewLine label="Estado" value={formatStatusLabel(editor.estado)} />
          <ReviewLine label="Descripción" value={editor.descripcion || "Sin descripción"} multiline />
        </ReviewCard>
        <ReviewCard title="Preguntas" action="Editar" onClick={onEditQuestions}>
          <ReviewLine label="Total" value={`${editor.questions.length} preguntas`} />
          <ReviewLine
            label="Tipos"
            value={Array.from(new Set(editor.questions.map((question) => question.tipo_pregunta))).join(", ") || "Sin preguntas"}
            multiline
          />
        </ReviewCard>
      </section>

      <section className="rounded-[16px] border border-[#e2dbcf] bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-[#3d3025]">Listado de preguntas</p>
            <p className="text-sm text-[#6d665d]">Se mostrarán en este orden.</p>
          </div>
          <Badge variant="secondary" className="rounded-full bg-[#faf8f3] text-[#6d665d]">
            {editor.questions.length}
          </Badge>
        </div>
        <div className="mt-4 space-y-3">
          {editor.questions.map((question, index) => (
            <div key={question.id ?? `review-question-${index}`} className="rounded-[20px] border border-[#ebe4d9] bg-[#fdfcf9] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full bg-[#2f6f35] text-white hover:bg-[#2f6f35]">
                  {questionTypeOptions.find((option) => option.value === question.tipo_pregunta)?.label ?? question.tipo_pregunta}
                </Badge>
                {question.es_obligatoria ? (
                  <Badge className="rounded-full bg-[#d9eadc] text-[#2f5b3a] hover:bg-[#d9eadc]">Obligatoria</Badge>
                ) : null}
              </div>
              <p className="mt-3 font-semibold text-[#3d3025]">{question.texto_pregunta || `Pregunta ${index + 1}`}</p>
              {(question.tipo_pregunta === "opcion_unica" || question.tipo_pregunta === "opcion_multiple") && question.opciones.length ? (
                <p className="mt-2 text-sm leading-6 text-[#6d665d]">
                  Opciones: {question.opciones.map((option) => option.etiqueta_opcion || option.valor_opcion).join(", ")}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      {issues.length ? (
        <div className="rounded-[20px] border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Ajustes pendientes</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {issues.slice(0, 6).map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="flex gap-3 rounded-[20px] border border-[#b9d2be] bg-[#edf5ee] p-4 text-sm text-[#2f5b3a]">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <div>La encuesta está lista para guardarse.</div>
        </div>
      )}

      <div className="flex flex-wrap justify-between gap-3 border-t border-[#e2dbcf] pt-6">
        <Button type="button" variant="outline" className="rounded-2xl" onClick={onBack}>
          Volver
        </Button>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" className="rounded-2xl" onClick={onSaveDraft} disabled={isSaving || issues.length > 0}>
            Guardar borrador
          </Button>
          <Button type="button" className="rounded-2xl" onClick={onPublish} disabled={isSaving || issues.length > 0}>
            Guardar y publicar
          </Button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <Label className="mb-2 inline-block text-sm font-medium text-[#6d665d]">{label}</Label>
      {children}
    </div>
  )
}

function QuestionCard({
  question,
  index,
  onChange,
  onRemove,
  onDuplicate,
}: {
  question: SurveyQuestionForm
  index: number
  onChange: (value: SurveyQuestionForm) => void
  onRemove: () => void
  onDuplicate: () => void
}) {
  const needsOptions = question.tipo_pregunta === "opcion_unica" || question.tipo_pregunta === "opcion_multiple"

  useEffect(() => {
    if (!needsOptions && question.opciones.length) onChange({ ...question, opciones: [] })
  }, [needsOptions, onChange, question])

  return (
    <div className="rounded-[16px] border border-[#e2dbcf] bg-white p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#6d665d]">Pregunta {index + 1}</p>
          <p className="mt-1 break-words text-lg font-semibold text-[#3d3025]">{question.texto_pregunta || "Escribe el enunciado de la pregunta"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="rounded-2xl" onClick={onDuplicate}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicar
          </Button>
          <Button type="button" variant="ghost" className="rounded-2xl text-red-600 hover:bg-red-50 hover:text-red-700" onClick={onRemove}>
            <Trash2 className="mr-2 h-4 w-4" />
            Quitar
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[140px,220px,1fr]">
        <Field label="Código">
          <Input
            value={question.codigo_pregunta}
            onChange={(event) => onChange({ ...question, codigo_pregunta: event.target.value })}
            className="h-12 rounded-2xl border-[#e2dbcf] bg-[#faf8f3]"
          />
        </Field>
        <Field label="Tipo">
          <Select value={question.tipo_pregunta} onValueChange={(value: SurveyQuestionForm["tipo_pregunta"]) => onChange({ ...question, tipo_pregunta: value })}>
            <SelectTrigger className="h-12 rounded-2xl border-[#e2dbcf] bg-[#faf8f3]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {questionTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <div className="flex items-center rounded-2xl border border-[#e2dbcf] bg-[#faf8f3] px-4 py-3">
          <Switch checked={question.es_obligatoria} onCheckedChange={(value) => onChange({ ...question, es_obligatoria: value })} />
          <span className="ml-3 text-sm font-medium text-[#3d3025]">Obligatoria</span>
        </div>
      </div>

      <div className="mt-4">
        <Field label="Pregunta">
          <Textarea
            value={question.texto_pregunta}
            onChange={(event) => onChange({ ...question, texto_pregunta: event.target.value })}
            className="min-h-[100px] rounded-2xl border-[#e2dbcf] bg-[#faf8f3]"
          />
        </Field>
      </div>

      {needsOptions ? (
        <div className="mt-5 rounded-[16px] border border-[#e2dbcf] bg-[#faf8f3] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-[#3d3025]">Opciones</p>
              <p className="text-sm text-[#6d665d]">Texto visible y valor.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl"
              onClick={() =>
                onChange({
                  ...question,
                  opciones: [
                    ...question.opciones,
                    {
                      valor_opcion: `opcion_${question.opciones.length + 1}`,
                      etiqueta_opcion: "",
                      posicion: question.opciones.length + 1,
                      permite_texto_libre: false,
                    },
                  ],
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar opción
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            {question.opciones.map((option, optionIndex) => (
              <div key={option.id ?? `option-${optionIndex}`} className="grid gap-3 rounded-[18px] bg-white p-4 lg:grid-cols-[1fr,1fr,auto]">
                <Input
                  value={option.etiqueta_opcion}
                  onChange={(event) => {
                    const updated = [...question.opciones]
                    updated[optionIndex] = { ...updated[optionIndex], etiqueta_opcion: event.target.value }
                    onChange({ ...question, opciones: updated })
                  }}
                  placeholder="Texto visible"
                  className="h-11 rounded-2xl border-[#e2dbcf] bg-[#faf8f3]"
                />
                <Input
                  value={option.valor_opcion}
                  onChange={(event) => {
                    const updated = [...question.opciones]
                    updated[optionIndex] = { ...updated[optionIndex], valor_opcion: event.target.value }
                    onChange({ ...question, opciones: updated })
                  }}
                  placeholder="Valor interno"
                  className="h-11 rounded-2xl border-[#e2dbcf] bg-[#faf8f3]"
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-2xl text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => {
                    const updated = question.opciones.filter((_, currentIndex) => currentIndex !== optionIndex)
                    onChange({ ...question, opciones: updated })
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Quitar
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function StepTab({
  step,
  title,
  isActive,
  isComplete,
  onClick,
}: {
  step: number
  title: string
  isActive: boolean
  isComplete: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[16px] border px-4 py-4 text-left transition ${
        isActive
          ? "border-[#2f6f35] bg-[#eef5ee] text-[#22562d]"
          : "border-[#e2dbcf] bg-white text-[#3d3025] hover:border-[#cdb79d]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isActive ? "bg-white text-[#2f6f35]" : "bg-[#faf8f3] text-[#6d665d]"}`}>
          Paso {step}
        </span>
        {isComplete ? <CheckCircle2 className={`h-4 w-4 ${isActive ? "text-[#2f6f35]" : "text-[#2f6f35]"}`} /> : null}
      </div>
      <p className="mt-3 text-lg font-semibold">{title}</p>
    </button>
  )
}


function ReviewCard({ title, action, onClick, children }: { title: string; action: string; onClick: () => void; children: ReactNode }) {
  return (
    <div className="rounded-[16px] border border-[#e2dbcf] bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-lg font-semibold text-[#3d3025]">{title}</p>
        <Button type="button" variant="outline" className="rounded-2xl" onClick={onClick}>
          {action}
        </Button>
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  )
}

function ReviewLine({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className={`rounded-[18px] bg-[#faf8f3] px-4 py-3 ${multiline ? "space-y-1" : "flex items-center justify-between gap-3"}`}>
      <span className="text-sm text-[#6d665d]">{label}</span>
      <span className={`font-medium text-[#3d3025] ${multiline ? "block" : "text-right"}`}>{value}</span>
    </div>
  )
}
