export type DashboardFilters = {
  fechaInicio?: string
  fechaFin?: string
  encuestaId?: string
}

export type SurveyStatus = "borrador" | "publicada" | "archivada" | string

export type DashboardSurvey = {
  id: string
  titulo: string
  descripcion?: string | null
  estado: SurveyStatus
  fecha_creacion?: string
  logo_url?: string | null
  response_count?: number
  question_count?: number
}

export type DashboardQuestionOption = {
  id?: string
  valor_opcion: string
  etiqueta_opcion: string
  posicion: number
  permite_texto_libre?: boolean
}

export type DashboardQuestion = {
  id: string
  codigo_pregunta: string
  texto_pregunta: string
  tipo_pregunta: string
  posicion: number
  es_obligatoria?: boolean
  opciones_pregunta?: DashboardQuestionOption[] | null
}

export type DashboardResponseOption = {
  id: string
  opcion_id: string
  texto_libre?: string | null
}

export type DashboardResponseDetail = {
  id: string
  pregunta_id: string
  respuesta_texto?: string | null
  respuesta_numero?: number | null
  respuesta_booleano?: boolean | null
  respuesta_fecha?: string | null
  respuestas_opciones_seleccionadas?: DashboardResponseOption[] | null
}

export type DashboardResponse = {
  id: string
  encuesta_id: string
  fecha_respuesta: string
  respuestas_detalle?: DashboardResponseDetail[] | null
}

export type QuestionDistributionItem = {
  etiqueta: string
  valor: number
}

export type RecentResponseItem = {
  responseId: string
  fecha: string
  respondentName: string
  answerPreview: string
}

export type EventSuggestion = {
  fecha: string
  total: number
  motivo: string
}

export type QuestionAnalyticsCard = {
  question: DashboardQuestion
  distribution: QuestionDistributionItem[]
  respondentItems: RecentResponseItem[]
  totalAnswered: number
  dominantLabel: string
  uniqueRespondents: number
}

export type DashboardMetrics = {
  totalResponses: number
  activeDays: number
  uniqueSurveys: number
  latestResponse: string
}

export type SurveyQuestionForm = {
  id?: string
  codigo_pregunta: string
  texto_pregunta: string
  tipo_pregunta:
    | "texto_corto"
    | "texto_largo"
    | "numero"
    | "booleano"
    | "opcion_unica"
    | "opcion_multiple"
  es_obligatoria: boolean
  opciones: DashboardQuestionOption[]
}

export type SurveyEditorData = {
  id?: string
  titulo: string
  descripcion: string
  estado: "borrador" | "publicada"
  logo_url?: string
  response_count?: number
  questions: SurveyQuestionForm[]
}
