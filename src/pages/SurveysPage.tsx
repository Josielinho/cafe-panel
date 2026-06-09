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
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
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

    // Removing auto-selection of the first survey to default to list view
    if (!routeSurveyId && !routeMode && selectedSurveyId) {
       setSelectedSurveyId(null);
       setIsCreatingNew(false);
    }
  }, [isCreatingNew, routeMode, routeSurveyId, selectedSurveyId])

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
  
  const backToList = () => {
    setSelectedSurveyId(null)
    setIsCreatingNew(false)
    setSearchParams({}, { replace: true })
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
  
  const isListView = !isCreatingNew && !selectedSurveyId;

  return (
    <>
      <div className="bg-background rounded-2xl border border-border overflow-hidden">
        {isListView ? (
          <>
            <section className="border-b border-border px-5 py-5 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">Encuestas</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Gestiona tus encuestas y formularios.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative max-w-sm w-full sm:w-[250px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Buscar..."
                      className="pl-9 h-10 bg-background"
                    />
                  </div>
                  <Button onClick={startNewSurvey} className="h-10">
                    <Plus className="mr-2 h-4 w-4" />
                    Crear
                  </Button>
                </div>
              </div>
            </section>
            <section className="p-0">
               {filteredSurveys.length > 0 ? (
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border">
                        <tr>
                          <th className="px-6 py-4 font-medium">Título</th>
                          <th className="px-6 py-4 font-medium">Estado</th>
                          <th className="px-6 py-4 font-medium">Preguntas</th>
                          <th className="px-6 py-4 font-medium">Respuestas</th>
                          <th className="px-6 py-4 font-medium text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredSurveys.map(survey => (
                          <tr key={survey.id} className="table-row-hover bg-background">
                            <td className="px-6 py-4">
                              <button onClick={() => openExistingSurvey(survey.id)} className="font-semibold text-foreground hover:underline text-left">
                                {survey.titulo}
                              </button>
                              {survey.descripcion && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{survey.descripcion}</p>}
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant="outline" className={survey.estado === 'publicada' ? 'border-primary text-primary bg-primary/10' : 'border-accent text-accent bg-accent/10'}>
                                {formatStatusLabel(survey.estado)}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-muted-foreground">
                              {survey.question_count ?? 0}
                            </td>
                            <td className="px-6 py-4 text-muted-foreground">
                              {survey.response_count ?? 0}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => openExistingSurvey(survey.id)}>
                                  <FilePenLine className="h-4 w-4 text-muted-foreground" />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => {
                                  setSelectedSurveyId(survey.id);
                                  setIsDeleteDialogOpen(true);
                                  setEditor({...editor, id: survey.id}); // temp fix for delete dialog
                                }}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
               ) : (
                 <div className="py-12 text-center text-muted-foreground">
                   No se encontraron encuestas.
                 </div>
               )}
            </section>
          </>
        ) : (
          <>
            <section className="border-b border-border px-5 py-5 sm:px-6 lg:px-8 bg-muted/10">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Button variant="ghost" size="sm" onClick={backToList} className="-ml-2 h-7 px-2 text-muted-foreground">
                      <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
                      Volver
                    </Button>
                    <span>•</span>
                    <Badge className={editor.estado === "publicada" ? "rounded-full bg-primary text-primary-foreground" : "rounded-full bg-accent text-accent-foreground"}>
                      {formatStatusLabel(editor.estado)}
                    </Badge>
                    <span>•</span>
                    <span>{editor.questions.length} preguntas</span>
                    <span>•</span>
                    <span>{formatRecordCount(responseCount)}</span>
                  </div>
                  <h2 className="max-w-5xl break-words text-[2rem] font-bold leading-tight text-foreground tracking-tight">
                    {headerTitle}
                  </h2>
                  <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
                    {headerDescription}
                  </p>
                </div>

                <div className="flex w-full max-w-[400px] flex-col gap-3 xl:items-end">
                  <div className="flex w-full flex-wrap items-center justify-between xl:justify-end gap-3">
                    <div className="text-sm text-muted-foreground xl:mr-4">{selectedSurveyId ? "Modo edición" : "Modo creación"}</div>
                    {editor.id ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => setIsDeleteDialogOpen(true)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>
            
            <section className="border-b border-border px-5 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-2">
                {builderSteps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <button
                      type="button"
                      onClick={() => {
                        if (step.id === 3 && !canAdvanceToReview) {
                          toast.error("Completa los campos pendientes antes de revisar.")
                          return
                        }
                        setActiveStep(step.id as 1 | 2 | 3)
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-full transition-colors text-sm font-medium ${
                        activeStep === step.id
                          ? "bg-primary text-primary-foreground"
                          : step.id < activeStep
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      <step.icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{step.title}</span>
                      <span className="sm:hidden">{step.id}</span>
                    </button>
                    {index < builderSteps.length - 1 && (
                      <div className="w-8 sm:w-12 h-[2px] mx-2 bg-border" />
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="p-5 sm:p-6 lg:p-8 bg-background">
              {isEditorLoading ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
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
          </>
        )}
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-xl overflow-hidden rounded-2xl border-border p-0">
          <div className="bg-destructive/10 px-6 py-5">
            <DialogHeader>
              <DialogTitle className="text-xl text-destructive">Eliminar encuesta</DialogTitle>
              <DialogDescription className="mt-2 text-sm leading-6 text-destructive/80">
                Esta acción eliminará la encuesta, sus preguntas y todas las respuestas asociadas.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="space-y-5 px-6 py-6 bg-background">
            <div className="rounded-xl border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">Verificación requerida</p>
              <p className="mt-2 leading-6">
                Escribe <span className="font-semibold text-foreground">borrar encuesta</span> y marca la casilla para habilitar la eliminación.
              </p>
            </div>

            <Field label='Escribe "borrar encuesta"'>
              <Input
                value={deleteConfirmText}
                onChange={(event) => setDeleteConfirmText(event.target.value)}
                placeholder="borrar encuesta"
                className="h-11 bg-background"
              />
            </Field>

            <label className="flex items-start gap-3 rounded-xl border border-border bg-background p-4 cursor-pointer">
              <Checkbox
                checked={deleteChecklistChecked}
                onCheckedChange={(checked) => setDeleteChecklistChecked(Boolean(checked))}
                className="mt-1 h-5 w-5 rounded-md"
              />
              <div>
                <p className="font-medium text-foreground">Entiendo que esta acción borra el historial de esta encuesta.</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">No se podrá recuperar desde el panel una vez confirmada.</p>
              </div>
            </label>
          </div>
          <DialogFooter className="border-t border-border bg-muted/20 px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!deleteReady || deleteMutation.isPending || !editor.id}
              onClick={() => {
                if (!editor.id) return
                deleteMutation.mutate({ surveyId: editor.id, confirmed: true })
              }}
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar definitivamente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
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
    <div className="space-y-6 max-w-4xl fade-in">
      <section className="grid gap-6 lg:grid-cols-2">
        <Field label="Título de la encuesta">
          <Input
            value={editor.titulo}
            onChange={(event) => onChange((current) => ({ ...current, titulo: event.target.value }))}
            placeholder="Ejemplo: Encuesta de satisfacción"
            className="h-11 bg-background"
          />
        </Field>
        <Field label="Estado">
          <Select value={editor.estado} onValueChange={(value: "borrador" | "publicada") => onChange((current) => ({ ...current, estado: value }))}>
            <SelectTrigger className="h-11 bg-background">
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
            className="min-h-[140px] bg-background"
          />
        </Field>

        <Field label="Logo o imagen (opcional)" className="lg:col-span-2">
          <Input
            value={editor.logo_url ?? ""}
            onChange={(event) => onChange((current) => ({ ...current, logo_url: event.target.value }))}
            placeholder="Pega aquí la URL del logo"
            className="h-11 bg-background"
          />
        </Field>
      </section>

      <div className="flex justify-end border-t border-border pt-6">
        <Button type="button" onClick={onNext}>
          Siguiente paso
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
    <div className="space-y-6 fade-in max-w-5xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground tracking-tight">Preguntas de la encuesta</h3>
          <p className="text-sm text-muted-foreground">Configura el orden y las opciones de respuesta.</p>
        </div>
        <Button type="button" variant="outline" onClick={onAddQuestion}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva pregunta
        </Button>
      </div>

      <section className="space-y-4">
        {editor.questions.map((question, index) => (
          <QuestionRow
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

      <div className="flex justify-center border border-dashed border-border rounded-xl p-6 bg-muted/20">
        <Button type="button" variant="secondary" onClick={onAddQuestion}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar otra pregunta al final
        </Button>
      </div>

      <div className="flex flex-wrap justify-between gap-3 border-t border-border pt-6 mt-8">
        <Button type="button" variant="outline" onClick={onBack}>
          Volver
        </Button>
        <Button type="button" onClick={onNext}>
          Ir a revisión
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function QuestionRow({
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
  const [expanded, setExpanded] = useState(index === 0)
  const needsOptions = question.tipo_pregunta === "opcion_unica" || question.tipo_pregunta === "opcion_multiple"

  useEffect(() => {
    if (!needsOptions && question.opciones.length) onChange({ ...question, opciones: [] })
  }, [needsOptions, onChange, question])

  return (
    <div className={`border border-border rounded-xl bg-background transition-all ${expanded ? 'shadow-sm ring-1 ring-border' : ''}`}>
      {/* Row Header (Always visible) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="bg-muted text-muted-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0">
            {index + 1}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground truncate">
              {question.texto_pregunta || <span className="text-muted-foreground italic">Pregunta vacía</span>}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-[10px] uppercase font-semibold">
                 {questionTypeOptions.find((o) => o.value === question.tipo_pregunta)?.label}
              </Badge>
              {question.es_obligatoria && <span className="text-xs text-destructive font-medium">*Obligatoria</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:shrink-0" onClick={e => e.stopPropagation()}>
           <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={onDuplicate} title="Duplicar">
             <Copy className="h-4 w-4 text-muted-foreground" />
           </Button>
           <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={onRemove} title="Quitar">
             <Trash2 className="h-4 w-4" />
           </Button>
           <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExpanded(!expanded)}>
             {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
           </Button>
        </div>
      </div>

      {/* Expanded Editor */}
      {expanded && (
        <div className="p-4 pt-0 border-t border-border mt-2 slide-up">
           <div className="grid gap-4 mt-4 md:grid-cols-[1fr,200px,120px]">
             <Field label="Enunciado de la pregunta">
                <Textarea
                  value={question.texto_pregunta}
                  onChange={(event) => onChange({ ...question, texto_pregunta: event.target.value })}
                  className="min-h-[80px] bg-background resize-y"
                  placeholder="Ej. ¿Qué opinas de...?"
                />
             </Field>
             <div className="space-y-4">
                <Field label="Tipo de respuesta">
                  <Select value={question.tipo_pregunta} onValueChange={(value: SurveyQuestionForm["tipo_pregunta"]) => onChange({ ...question, tipo_pregunta: value })}>
                    <SelectTrigger className="bg-background">
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
                <Field label="Código int.">
                  <Input
                    value={question.codigo_pregunta}
                    onChange={(event) => onChange({ ...question, codigo_pregunta: event.target.value })}
                    className="bg-background"
                  />
                </Field>
             </div>
             <div className="flex flex-col gap-2 pt-8 pl-2 border-l border-border">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Switch checked={question.es_obligatoria} onCheckedChange={(value) => onChange({ ...question, es_obligatoria: value })} />
                  <span className="text-sm font-medium text-foreground">Obligatoria</span>
                </label>
             </div>
           </div>

           {needsOptions && (
             <div className="mt-6 border border-border rounded-lg p-4 bg-muted/10">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-sm font-medium">Opciones de respuesta</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
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
                    <Plus className="mr-2 h-3 w-3" />
                    Agregar
                  </Button>
                </div>
                <div className="space-y-2">
                  {question.opciones.map((option, optionIndex) => (
                    <div key={option.id ?? `option-${optionIndex}`} className="flex items-center gap-2 bg-background p-2 rounded-md border border-border">
                      <Input
                        value={option.etiqueta_opcion}
                        onChange={(event) => {
                          const updated = [...question.opciones]
                          updated[optionIndex] = { ...updated[optionIndex], etiqueta_opcion: event.target.value }
                          onChange({ ...question, opciones: updated })
                        }}
                        placeholder="Texto visible (Ej. Muy bueno)"
                        className="h-9 text-sm"
                      />
                      <Input
                        value={option.valor_opcion}
                        onChange={(event) => {
                          const updated = [...question.opciones]
                          updated[optionIndex] = { ...updated[optionIndex], valor_opcion: event.target.value }
                          onChange({ ...question, opciones: updated })
                        }}
                        placeholder="Valor interno (Ej. 5)"
                        className="h-9 text-sm font-mono"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-destructive shrink-0"
                        onClick={() => {
                          const updated = question.opciones.filter((_, currentIndex) => currentIndex !== optionIndex)
                          onChange({ ...question, opciones: updated })
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {question.opciones.length === 0 && (
                    <p className="text-sm text-muted-foreground italic text-center py-2">No hay opciones configuradas. Agrega al menos dos.</p>
                  )}
                </div>
             </div>
           )}
        </div>
      )}
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
    <div className="space-y-8 fade-in max-w-4xl">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="border border-border rounded-xl overflow-hidden bg-background">
           <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
             <h4 className="font-semibold text-foreground">1. Datos Generales</h4>
             <Button variant="ghost" size="sm" onClick={onEditBasics} className="text-muted-foreground">Editar</Button>
           </div>
           <div className="p-4 space-y-3">
             <div>
               <span className="text-xs text-muted-foreground uppercase">Título</span>
               <p className="font-medium text-foreground">{editor.titulo || <span className="text-destructive italic">Falta título</span>}</p>
             </div>
             <div>
               <span className="text-xs text-muted-foreground uppercase">Descripción</span>
               <p className="text-sm text-foreground whitespace-pre-wrap">{editor.descripcion || "Sin descripción"}</p>
             </div>
             <div>
               <span className="text-xs text-muted-foreground uppercase">Estado a guardar</span>
               <p className="font-medium text-foreground">{formatStatusLabel(editor.estado)}</p>
             </div>
           </div>
        </div>

        <div className="border border-border rounded-xl overflow-hidden bg-background">
           <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
             <h4 className="font-semibold text-foreground">2. Estructura ({editor.questions.length})</h4>
             <Button variant="ghost" size="sm" onClick={onEditQuestions} className="text-muted-foreground">Editar</Button>
           </div>
           <div className="p-4">
              <ul className="space-y-3 text-sm">
                {editor.questions.slice(0,5).map((q, i) => (
                  <li key={i} className="flex gap-2 text-foreground">
                    <span className="font-medium shrink-0">{i+1}.</span> 
                    <span className="truncate">{q.texto_pregunta || "Pregunta sin texto"}</span>
                    <Badge variant="outline" className="ml-auto shrink-0 text-[10px]">
                      {questionTypeOptions.find((o) => o.value === q.tipo_pregunta)?.label}
                    </Badge>
                  </li>
                ))}
                {editor.questions.length > 5 && (
                  <li className="text-muted-foreground italic text-center pt-2">...y {editor.questions.length - 5} preguntas más</li>
                )}
              </ul>
           </div>
        </div>
      </div>

      {issues.length ? (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-5 text-sm">
          <div className="flex items-center gap-2 text-destructive font-semibold mb-3">
             <AlertTriangle className="h-5 w-5" />
             <p>Ajustes pendientes antes de guardar</p>
          </div>
          <ul className="list-disc space-y-1 pl-6 text-destructive/90">
            {issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 p-5 text-sm text-primary-foreground font-medium">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          <div className="text-primary">La encuesta está lista para guardarse sin errores de validación.</div>
        </div>
      )}

      <div className="flex flex-wrap justify-between gap-3 border-t border-border pt-6 mt-8">
        <Button type="button" variant="outline" onClick={onBack}>
          Volver a preguntas
        </Button>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="secondary" onClick={onSaveDraft} disabled={isSaving || issues.length > 0}>
            Guardar como borrador
          </Button>
          <Button type="button" onClick={onPublish} disabled={isSaving || issues.length > 0}>
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
      <Label className="mb-2 inline-block text-sm font-medium text-foreground">{label}</Label>
      {children}
    </div>
  )
}
