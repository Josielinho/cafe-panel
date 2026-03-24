import type {
  DashboardMetrics,
  DashboardQuestion,
  DashboardResponse,
  DashboardResponseDetail,
  EventSuggestion,
  QuestionAnalyticsCard,
  QuestionDistributionItem,
  RecentResponseItem,
} from "@/types/dashboardTypes"

function formatDateKey(value: string) {
  return value.slice(0, 10)
}

function formatDateLabel(value: string) {
  const date = new Date(`${value}T00:00:00`)
  return new Intl.DateTimeFormat("es-PA", {
    day: "2-digit",
    month: "short",
  }).format(date)
}

export function formatDateTime(value: string) {
  const date = new Date(value)
  return new Intl.DateTimeFormat("es-PA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

export function formatQuestionType(type: string) {
  const map: Record<string, string> = {
    texto_corto: "Texto corto",
    texto_largo: "Texto largo",
    numero: "Número",
    booleano: "Sí / No",
    opcion_unica: "Selección única",
    opcion_multiple: "Selección múltiple",
  }

  return map[type] ?? type
}

function average(values: number[]) {
  if (!values.length) return 0
  return values.reduce((sum, current) => sum + current, 0) / values.length
}

function standardDeviation(values: number[]) {
  if (values.length <= 1) return 0
  const mean = average(values)
  const variance =
    values.reduce((sum, current) => sum + (current - mean) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

export function getResponseDetail(response: DashboardResponse, questionId: string) {
  return response.respuestas_detalle?.find((item) => item.pregunta_id === questionId)
}

export function extractRawAnswer(detail: DashboardResponseDetail | undefined, question: DashboardQuestion) {
  if (!detail) return ""

  const optionSelections = detail.respuestas_opciones_seleccionadas ?? []
  const optionMap = new Map(
    (question.opciones_pregunta ?? []).map((option) => [option.id, option.etiqueta_opcion])
  )

  if (question.tipo_pregunta === "opcion_unica" || question.tipo_pregunta === "opcion_multiple") {
    const labels = optionSelections
      .map((row) => optionMap.get(row.opcion_id) ?? "Sin etiqueta")
      .filter(Boolean)

    if (labels.length) {
      const freeText = optionSelections
        .map((row) => row.texto_libre?.trim())
        .filter(Boolean)
        .join(" | ")

      return [labels.join(", "), freeText].filter(Boolean).join(" · ")
    }
  }

  if (typeof detail.respuesta_booleano === "boolean") {
    return detail.respuesta_booleano ? "Sí" : "No"
  }

  if (detail.respuesta_numero !== null && detail.respuesta_numero !== undefined) {
    return String(detail.respuesta_numero)
  }

  if (detail.respuesta_fecha) {
    return detail.respuesta_fecha
  }

  return detail.respuesta_texto?.trim() ?? ""
}

function findNameQuestion(questions: DashboardQuestion[]) {
  return questions.find((question) => {
    const source = `${question.codigo_pregunta} ${question.texto_pregunta}`.toLowerCase()
    return source.includes("nombre") || source.includes("encuestado")
  })
}

export function getRespondentName(response: DashboardResponse, questions: DashboardQuestion[]) {
  const nameQuestion = findNameQuestion(questions)
  if (nameQuestion) {
    const detail = getResponseDetail(response, nameQuestion.id)
    const value = extractRawAnswer(detail, nameQuestion)
    if (value) return value
  }

  return "Persona sin nombre"
}

export function buildDailySeries(responses: DashboardResponse[]) {
  const buckets = new Map<string, number>()

  for (const response of responses) {
    const key = formatDateKey(response.fecha_respuesta)
    buckets.set(key, (buckets.get(key) ?? 0) + 1)
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, total]) => ({
      fecha,
      etiqueta: formatDateLabel(fecha),
      total,
    }))
}

export function buildSurveySeries(
  responses: DashboardResponse[],
  surveyMap: Map<string, string>
) {
  const buckets = new Map<string, number>()

  for (const response of responses) {
    const surveyTitle = surveyMap.get(response.encuesta_id) ?? "Encuesta sin nombre"
    buckets.set(surveyTitle, (buckets.get(surveyTitle) ?? 0) + 1)
  }

  return Array.from(buckets.entries())
    .map(([encuesta, total]) => ({ encuesta, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)
}

export function buildQuestionDistribution(
  responses: DashboardResponse[],
  question?: DashboardQuestion
): QuestionDistributionItem[] {
  if (!question) return []

  const buckets = new Map<string, number>()

  for (const response of responses) {
    const detail = getResponseDetail(response, question.id)
    if (!detail) continue

    if (question.tipo_pregunta === "opcion_unica" || question.tipo_pregunta === "opcion_multiple") {
      const optionMap = new Map(
        (question.opciones_pregunta ?? []).map((option) => [option.id, option.etiqueta_opcion])
      )
      const selected = detail.respuestas_opciones_seleccionadas ?? []
      if (selected.length) {
        for (const row of selected) {
          const label = optionMap.get(row.opcion_id) ?? "Sin etiqueta"
          buckets.set(label, (buckets.get(label) ?? 0) + 1)
        }
        continue
      }
    }

    const label = extractRawAnswer(detail, question) || "Sin respuesta"
    buckets.set(label, (buckets.get(label) ?? 0) + 1)
  }

  return Array.from(buckets.entries())
    .map(([etiqueta, valor]) => ({ etiqueta, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 8)
}

function getRespondentKey(response: DashboardResponse, questions: DashboardQuestion[]) {
  const inferredName = getRespondentName(response, questions).trim().toLowerCase()
  if (inferredName && inferredName !== "persona sin nombre") return `nombre:${inferredName}`

  return `respuesta:${response.id}`
}

export function buildRespondentItems(
  responses: DashboardResponse[],
  question: DashboardQuestion,
  allQuestions: DashboardQuestion[]
): RecentResponseItem[] {
  return [...responses]
    .sort((a, b) => b.fecha_respuesta.localeCompare(a.fecha_respuesta))
    .map((response) => {
      const detail = getResponseDetail(response, question.id)
      if (!detail) return null

      return {
        responseId: response.id,
        fecha: formatDateTime(response.fecha_respuesta),
        respondentName: getRespondentName(response, allQuestions),
        answerPreview: extractRawAnswer(detail, question) || "Sin respuesta",
      }
    })
    .filter((item): item is RecentResponseItem => Boolean(item))
}

export function buildAllQuestionAnalytics(
  responses: DashboardResponse[],
  questions: DashboardQuestion[]
): QuestionAnalyticsCard[] {
  return questions.map((question) => {
    const distribution = buildQuestionDistribution(responses, question)
    const respondentItems = buildRespondentItems(responses, question, questions)
    const respondents = new Set(
      responses
        .filter((response) => Boolean(getResponseDetail(response, question.id)))
        .map((response) => getRespondentKey(response, questions))
    )

    const totalAnswered = responses.reduce((total, response) => {
      const detail = getResponseDetail(response, question.id)
      return detail ? total + 1 : total
    }, 0)

    return {
      question,
      distribution,
      respondentItems,
      totalAnswered,
      dominantLabel: distribution[0]?.etiqueta ?? "Sin respuestas",
      uniqueRespondents: respondents.size,
    }
  })
}

export function buildEventSuggestions(responses: DashboardResponse[]): EventSuggestion[] {
  const series = buildDailySeries(responses)
  const counts = series.map((item) => item.total)
  const mean = average(counts)
  const deviation = standardDeviation(counts)
  const threshold = Math.max(2, Math.ceil(mean + deviation))

  return series
    .filter((item) => item.total >= threshold)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map((item) => ({
      fecha: item.fecha,
      total: item.total,
      motivo:
        item.total >= Math.ceil(mean + deviation * 1.5)
          ? "Pico fuerte de participación"
          : "Actividad por encima del promedio",
    }))
}

export function buildDashboardMetrics(responses: DashboardResponse[], questions: DashboardQuestion[]): DashboardMetrics {
  const ordered = [...responses].sort((a, b) => a.fecha_respuesta.localeCompare(b.fecha_respuesta))
  const totalResponses = new Set(ordered.map((response) => getRespondentKey(response, questions))).size
  const activeDays = new Set(ordered.map((item) => formatDateKey(item.fecha_respuesta))).size
  const uniqueSurveys = new Set(ordered.map((item) => item.encuesta_id)).size
  const latestResponse = ordered.length
    ? formatDateTime(ordered[ordered.length - 1].fecha_respuesta)
    : "Sin datos"

  return {
    totalResponses,
    activeDays,
    uniqueSurveys,
    latestResponse,
  }
}
