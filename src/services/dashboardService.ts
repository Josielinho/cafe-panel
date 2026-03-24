import { supabase } from "@/lib/supabaseClient"
import type {
  DashboardFilters,
  DashboardQuestion,
  DashboardResponse,
  DashboardSurvey,
  SurveyEditorData,
  SurveyQuestionForm,
} from "@/types/dashboardTypes"

function sortQuestions(questions: DashboardQuestion[] = []) {
  return questions
    .map((question) => ({
      ...question,
      opciones_pregunta: (question.opciones_pregunta ?? []).sort((a, b) => a.posicion - b.posicion),
    }))
    .sort((a, b) => a.posicion - b.posicion)
}

function toQuestionForm(question: any): SurveyQuestionForm {
  return {
    id: question.id,
    codigo_pregunta: question.codigo_pregunta,
    texto_pregunta: question.texto_pregunta,
    tipo_pregunta: question.tipo_pregunta,
    es_obligatoria: Boolean(question.es_obligatoria),
    opciones: (question.opciones_pregunta ?? [])
      .sort((a: any, b: any) => a.posicion - b.posicion)
      .map((option: any) => ({
        id: option.id,
        valor_opcion: option.valor_opcion,
        etiqueta_opcion: option.etiqueta_opcion,
        posicion: option.posicion,
        permite_texto_libre: Boolean(option.permite_texto_libre),
      })),
  }
}

export async function fetchDashboardSurveys(): Promise<DashboardSurvey[]> {
  const [
    { data: surveys, error: surveysError },
    { data: responses, error: responsesError },
    { data: questions, error: questionsError },
  ] = await Promise.all([
    supabase
      .from("encuestas")
      .select("id, titulo, descripcion, estado, fecha_creacion, logo_url")
      .order("fecha_creacion", { ascending: false }),
    supabase.from("respuestas_encuesta").select("encuesta_id"),
    supabase.from("preguntas_encuesta").select("encuesta_id"),
  ])

  if (surveysError) throw surveysError
  if (responsesError) throw responsesError
  if (questionsError) throw questionsError

  const responseCountMap = new Map<string, number>()
  for (const row of responses ?? []) {
    responseCountMap.set(row.encuesta_id, (responseCountMap.get(row.encuesta_id) ?? 0) + 1)
  }

  const questionCountMap = new Map<string, number>()
  for (const row of questions ?? []) {
    questionCountMap.set(row.encuesta_id, (questionCountMap.get(row.encuesta_id) ?? 0) + 1)
  }

  return ((surveys ?? []) as DashboardSurvey[]).map((survey) => ({
    ...survey,
    response_count: responseCountMap.get(survey.id) ?? 0,
    question_count: questionCountMap.get(survey.id) ?? 0,
  }))
}

export async function fetchDashboardQuestions(encuestaId: string): Promise<DashboardQuestion[]> {
  const { data, error } = await supabase
    .from("preguntas_encuesta")
    .select(`
      id,
      codigo_pregunta,
      texto_pregunta,
      tipo_pregunta,
      posicion,
      es_obligatoria,
      opciones_pregunta (
        id,
        valor_opcion,
        etiqueta_opcion,
        posicion,
        permite_texto_libre
      )
    `)
    .eq("encuesta_id", encuestaId)
    .order("posicion", { ascending: true })

  if (error) throw error

  return sortQuestions((data ?? []) as DashboardQuestion[])
}

export async function fetchDashboardResponses(filters: DashboardFilters): Promise<DashboardResponse[]> {
  let query = supabase
    .from("respuestas_encuesta")
    .select(`
      id,
      encuesta_id,
      fecha_respuesta,
      respuestas_detalle (
        id,
        pregunta_id,
        respuesta_texto,
        respuesta_numero,
        respuesta_booleano,
        respuesta_fecha,
        respuestas_opciones_seleccionadas (
          id,
          opcion_id,
          texto_libre
        )
      )
    `)
    .order("fecha_respuesta", { ascending: false })

  if (filters.encuestaId) {
    query = query.eq("encuesta_id", filters.encuestaId)
  }

  if (filters.fechaInicio) {
    query = query.gte("fecha_respuesta", `${filters.fechaInicio}T00:00:00`)
  }

  if (filters.fechaFin) {
    query = query.lte("fecha_respuesta", `${filters.fechaFin}T23:59:59`)
  }

  const { data, error } = await query

  if (error) throw error
  return (data ?? []) as DashboardResponse[]
}



function escapeSpreadsheetValue(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function formatExportDate(value?: string | null) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("es-PA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function resolveDetailValue(detail: DashboardResponseDetail | undefined, question: DashboardQuestion) {
  if (!detail) return ""

  if (question.tipo_pregunta === "opcion_unica" || question.tipo_pregunta === "opcion_multiple") {
    const optionMap = new Map((question.opciones_pregunta ?? []).map((option) => [option.id, option.etiqueta_opcion]))
    return (detail.respuestas_opciones_seleccionadas ?? [])
      .map((selection) => {
        const label = optionMap.get(selection.opcion_id) ?? selection.opcion_id
        return selection.texto_libre ? `${label}: ${selection.texto_libre}` : label
      })
      .join(" | ")
  }

  if (detail.respuesta_texto != null) return String(detail.respuesta_texto)
  if (detail.respuesta_numero != null) return String(detail.respuesta_numero)
  if (detail.respuesta_booleano != null) return detail.respuesta_booleano ? "Sí" : "No"
  if (detail.respuesta_fecha != null) return String(detail.respuesta_fecha)
  return ""
}

function downloadHtmlAsExcel(filename: string, html: string) {
  const blob = new Blob(["\ufeff", html], { type: "application/vnd.ms-excel;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

function slugifyFilename(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
}

export async function exportSurveyResponsesToExcel(encuestaId: string) {
  const [{ data: survey, error: surveyError }, questions, responses] = await Promise.all([
    supabase.from("encuestas").select("id, titulo, estado").eq("id", encuestaId).single(),
    fetchDashboardQuestions(encuestaId),
    fetchDashboardResponses({ encuestaId }),
  ])

  if (surveyError) throw surveyError

  const headers = [
    "Fecha de respuesta",
    ...questions.map((question) => question.texto_pregunta),
  ]

  const rows = responses
    .map((response) => {
      const detailsMap = new Map((response.respuestas_detalle ?? []).map((detail) => [detail.pregunta_id, detail]))
      const answerCells = questions.map((question) => {
        const value = resolveDetailValue(detailsMap.get(question.id), question)
        return value ?? ""
      })

      const hasAnyAnswer = answerCells.some((cell) => String(cell).trim() !== "")
      if (!hasAnyAnswer) return null

      return [formatExportDate(response.fecha_respuesta), ...answerCells]
    })
    .filter((row): row is string[] => Array.isArray(row))

  const tableHead = `<tr>${headers.map((header) => `<th style="background:#f3efe7;font-weight:700;border:1px solid #d8cfbf;padding:8px;text-align:left;">${escapeSpreadsheetValue(header)}</th>`).join("")}</tr>`
  const tableBody = rows
    .map((row) => `<tr>${row.map((cell) => `<td style="border:1px solid #e1d8c9;padding:8px;vertical-align:top;">${escapeSpreadsheetValue(cell || "")}</td>`).join("")}</tr>`)
    .join("")

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
</head>
<body>
  <table>
    <tr><td colspan="${headers.length}" style="font-size:20px;font-weight:700;padding:10px 8px;">${escapeSpreadsheetValue(survey.titulo)}</td></tr>
    <tr><td colspan="${headers.length}" style="padding:0 8px 12px 8px;color:#6d665d;">Estado: ${escapeSpreadsheetValue(survey.estado ?? "")}</td></tr>
  </table>
  <table>
    <thead>${tableHead}</thead>
    <tbody>${tableBody}</tbody>
  </table>
</body>
</html>`

  const filename = `${slugifyFilename(survey.titulo || "encuesta") || "encuesta"}-respuestas.xls`
  downloadHtmlAsExcel(filename, html)
}
export async function fetchSurveyEditor(encuestaId: string): Promise<SurveyEditorData> {
  const { data, error } = await supabase
    .from("encuestas")
    .select(`
      id,
      titulo,
      descripcion,
      estado,
      logo_url,
      secciones_encuesta (
        id,
        titulo,
        descripcion,
        posicion,
        preguntas_encuesta (
          id,
          codigo_pregunta,
          texto_pregunta,
          tipo_pregunta,
          posicion,
          es_obligatoria,
          opciones_pregunta (
            id,
            valor_opcion,
            etiqueta_opcion,
            posicion,
            permite_texto_libre
          )
        )
      )
    `)
    .eq("id", encuestaId)
    .single()

  if (error) throw error

  const sections = (data.secciones_encuesta ?? []).sort((a: any, b: any) => a.posicion - b.posicion)
  const questions = sections.flatMap((section: any) =>
    (section.preguntas_encuesta ?? [])
      .sort((a: any, b: any) => a.posicion - b.posicion)
      .map(toQuestionForm)
  )

  const { count } = await supabase
    .from("respuestas_encuesta")
    .select("*", { count: "exact", head: true })
    .eq("encuesta_id", encuestaId)

  return {
    id: data.id,
    titulo: data.titulo,
    descripcion: data.descripcion ?? "",
    estado: data.estado === "publicada" ? "publicada" : "borrador",
    logo_url: data.logo_url ?? "",
    response_count: count ?? 0,
    questions,
  }
}

async function ensureSurveySection(encuestaId: string) {
  const { data: existing, error: existingError } = await supabase
    .from("secciones_encuesta")
    .select("id")
    .eq("encuesta_id", encuestaId)
    .order("posicion", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (existingError) throw existingError
  if (existing?.id) return existing.id

  const { data, error } = await supabase
    .from("secciones_encuesta")
    .insert({
      encuesta_id: encuestaId,
      titulo: "Sección principal",
      descripcion: "Creada desde el panel administrativo",
      posicion: 1,
    })
    .select("id")
    .single()

  if (error) throw error
  return data.id
}

async function deleteResponseSelectionsByDetailIds(detailIds: string[]) {
  if (!detailIds.length) return
  const { error } = await supabase
    .from("respuestas_opciones_seleccionadas")
    .delete()
    .in("respuesta_detalle_id", detailIds)

  if (error) throw error
}

async function deleteResponseSelectionsByOptionIds(optionIds: string[]) {
  if (!optionIds.length) return
  const { error } = await supabase
    .from("respuestas_opciones_seleccionadas")
    .delete()
    .in("opcion_id", optionIds)

  if (error) throw error
}

async function deleteQuestionAnswers(questionIds: string[]) {
  if (!questionIds.length) return

  const { data: details, error: detailsError } = await supabase
    .from("respuestas_detalle")
    .select("id")
    .in("pregunta_id", questionIds)

  if (detailsError) throw detailsError

  const detailIds = (details ?? []).map((item) => item.id)
  await deleteResponseSelectionsByDetailIds(detailIds)

  const { error } = await supabase
    .from("respuestas_detalle")
    .delete()
    .in("pregunta_id", questionIds)

  if (error) throw error
}

async function deleteQuestionsCascade(questionIds: string[]) {
  if (!questionIds.length) return

  const { data: optionRows, error: optionsLookupError } = await supabase
    .from("opciones_pregunta")
    .select("id")
    .in("pregunta_id", questionIds)

  if (optionsLookupError) throw optionsLookupError

  const optionIds = (optionRows ?? []).map((item) => item.id)
  await deleteResponseSelectionsByOptionIds(optionIds)
  await deleteQuestionAnswers(questionIds)

  if (questionIds.length) {
    const { error: optionsError } = await supabase
      .from("opciones_pregunta")
      .delete()
      .in("pregunta_id", questionIds)

    if (optionsError) throw optionsError

    const { error: questionsError } = await supabase
      .from("preguntas_encuesta")
      .delete()
      .in("id", questionIds)

    if (questionsError) throw questionsError
  }
}

async function saveQuestionOptions(questionId: string, question: SurveyQuestionForm) {
  const { data: existingOptions, error: existingError } = await supabase
    .from("opciones_pregunta")
    .select("id")
    .eq("pregunta_id", questionId)

  if (existingError) throw existingError

  const existingOptionIds = (existingOptions ?? []).map((option) => option.id)

  if (question.tipo_pregunta !== "opcion_unica" && question.tipo_pregunta !== "opcion_multiple") {
    await deleteResponseSelectionsByOptionIds(existingOptionIds)

    const { error } = await supabase.from("opciones_pregunta").delete().eq("pregunta_id", questionId)
    if (error) throw error
    return
  }

  const submittedOptionIds = new Set(question.opciones.map((option) => option.id).filter(Boolean))
  const optionIdsToDelete = existingOptionIds.filter((id) => !submittedOptionIds.has(id))

  if (optionIdsToDelete.length) {
    await deleteResponseSelectionsByOptionIds(optionIdsToDelete)
    const { error } = await supabase.from("opciones_pregunta").delete().in("id", optionIdsToDelete)
    if (error) throw error
  }

  for (let index = 0; index < question.opciones.length; index += 1) {
    const option = question.opciones[index]
    const payload = {
      pregunta_id: questionId,
      valor_opcion: option.valor_opcion,
      etiqueta_opcion: option.etiqueta_opcion,
      posicion: index + 1,
      permite_texto_libre: Boolean(option.permite_texto_libre),
    }

    if (option.id) {
      const { error } = await supabase.from("opciones_pregunta").update(payload).eq("id", option.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from("opciones_pregunta").insert(payload)
      if (error) throw error
    }
  }
}

export async function saveSurveyEditor(editor: SurveyEditorData): Promise<string> {
  const basePayload = {
    titulo: editor.titulo,
    descripcion: editor.descripcion || null,
    estado: editor.estado,
    logo_url: editor.logo_url || null,
  }

  let encuestaId = editor.id
  if (encuestaId) {
    const { error } = await supabase.from("encuestas").update(basePayload).eq("id", encuestaId)
    if (error) throw error
  } else {
    const { data, error } = await supabase.from("encuestas").insert(basePayload).select("id").single()
    if (error) throw error
    encuestaId = data.id
  }

  const sectionId = await ensureSurveySection(encuestaId)

  const { data: existingQuestions, error: questionsError } = await supabase
    .from("preguntas_encuesta")
    .select("id")
    .eq("encuesta_id", encuestaId)

  if (questionsError) throw questionsError

  const submittedQuestionIds = new Set(editor.questions.map((question) => question.id).filter(Boolean))
  const questionIdsToDelete = (existingQuestions ?? [])
    .map((question) => question.id)
    .filter((id) => !submittedQuestionIds.has(id))

  await deleteQuestionsCascade(questionIdsToDelete)

  for (let index = 0; index < editor.questions.length; index += 1) {
    const question = editor.questions[index]
    const questionPayload = {
      encuesta_id: encuestaId,
      seccion_id: sectionId,
      codigo_pregunta: question.codigo_pregunta || `P${index + 1}`,
      texto_pregunta: question.texto_pregunta,
      tipo_pregunta: question.tipo_pregunta,
      es_obligatoria: Boolean(question.es_obligatoria),
      posicion: index + 1,
    }

    let questionId = question.id

    if (questionId) {
      const { error } = await supabase.from("preguntas_encuesta").update(questionPayload).eq("id", questionId)
      if (error) throw error
    } else {
      const { data, error } = await supabase
        .from("preguntas_encuesta")
        .insert(questionPayload)
        .select("id")
        .single()
      if (error) throw error
      questionId = data.id
    }

    await saveQuestionOptions(questionId, question)
  }

  return encuestaId
}


export async function deleteSurveyResponse(responseId: string) {
  const { data: details, error: detailsError } = await supabase
    .from("respuestas_detalle")
    .select("id")
    .eq("respuesta_encuesta_id", responseId)

  if (detailsError) throw detailsError

  const detailIds = (details ?? []).map((item) => item.id)
  await deleteResponseSelectionsByDetailIds(detailIds)

  const { error: deleteDetailsError } = await supabase
    .from("respuestas_detalle")
    .delete()
    .eq("respuesta_encuesta_id", responseId)

  if (deleteDetailsError) throw deleteDetailsError

  const { error: deleteResponseError } = await supabase
    .from("respuestas_encuesta")
    .delete()
    .eq("id", responseId)

  if (deleteResponseError) throw deleteResponseError
}

async function deleteSurveyResponses(encuestaId: string) {
  const { data: responses, error: responsesError } = await supabase
    .from("respuestas_encuesta")
    .select("id")
    .eq("encuesta_id", encuestaId)

  if (responsesError) throw responsesError

  const responseIds = (responses ?? []).map((item) => item.id)
  if (!responseIds.length) return

  const { data: details, error: detailsError } = await supabase
    .from("respuestas_detalle")
    .select("id")
    .in("respuesta_encuesta_id", responseIds)

  if (detailsError) throw detailsError

  const detailIds = (details ?? []).map((item) => item.id)
  await deleteResponseSelectionsByDetailIds(detailIds)

  const { error: deleteDetailsError } = await supabase
    .from("respuestas_detalle")
    .delete()
    .in("respuesta_encuesta_id", responseIds)

  if (deleteDetailsError) throw deleteDetailsError

  const { error: deleteResponsesError } = await supabase
    .from("respuestas_encuesta")
    .delete()
    .in("id", responseIds)

  if (deleteResponsesError) throw deleteResponsesError
}

export async function deleteSurvey(encuestaId: string, options?: { confirmed?: boolean }) {
  if (!options?.confirmed) {
    throw new Error("Debes confirmar la eliminación antes de borrar una encuesta.")
  }

  const { data: questions, error: questionsError } = await supabase
    .from("preguntas_encuesta")
    .select("id")
    .eq("encuesta_id", encuestaId)

  if (questionsError) throw questionsError

  await deleteSurveyResponses(encuestaId)
  await deleteQuestionsCascade((questions ?? []).map((question) => question.id))

  const { error: sectionsError } = await supabase
    .from("secciones_encuesta")
    .delete()
    .eq("encuesta_id", encuestaId)
  if (sectionsError) throw sectionsError

  const { error } = await supabase.from("encuestas").delete().eq("id", encuestaId)
  if (error) throw error
}
