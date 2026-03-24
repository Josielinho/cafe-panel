import { supabase } from "../lib/supabaseClient"

type SingleChoiceAnswer = {
  type: "single_choice"
  optionId: string
  value: string
  textFree?: string
}

type MultipleChoiceAnswer = {
  type: "multiple_choice"
  selections: Array<{
    optionId: string
    value: string
    textFree?: string
  }>
}

type AnswerValue =
  | string
  | number
  | boolean
  | SingleChoiceAnswer
  | MultipleChoiceAnswer

export async function createResponse(encuestaId: string) {
  const { data, error } = await supabase
    .from("respuestas_encuesta")
    .insert({
      encuesta_id: encuestaId,
      origen: "web",
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function saveAnswer(
  respuestaEncuestaId: string,
  preguntaId: string,
  value: AnswerValue
) {
  const basePayload: {
    respuesta_encuesta_id: string
    pregunta_id: string
    respuesta_texto?: string | null
    respuesta_numero?: number | null
    respuesta_booleano?: boolean | null
  } = {
    respuesta_encuesta_id: respuestaEncuestaId,
    pregunta_id: preguntaId,
    respuesta_texto: null,
    respuesta_numero: null,
    respuesta_booleano: null,
  }

  if (typeof value === "string") {
    basePayload.respuesta_texto = value
  }

  if (typeof value === "number") {
    basePayload.respuesta_numero = value
  }

  if (typeof value === "boolean") {
    basePayload.respuesta_booleano = value
  }

  if (typeof value === "object" && value !== null && "type" in value) {
    if (value.type === "single_choice") {
      basePayload.respuesta_texto = value.value
    }

    if (value.type === "multiple_choice") {
      basePayload.respuesta_texto = value.selections.map((s) => s.value).join(", ")
    }
  }

  const { data: detail, error: detailError } = await supabase
    .from("respuestas_detalle")
    .insert(basePayload)
    .select()
    .single()

  if (detailError) throw detailError

  if (typeof value === "object" && value !== null && "type" in value) {
    if (value.type === "single_choice") {
      const { error } = await supabase.from("respuestas_opciones_seleccionadas").insert({
        respuesta_detalle_id: detail.id,
        opcion_id: value.optionId,
        texto_libre: value.textFree ?? null,
      })

      if (error) throw error
    }

    if (value.type === "multiple_choice") {
      const rows = value.selections.map((selection) => ({
        respuesta_detalle_id: detail.id,
        opcion_id: selection.optionId,
        texto_libre: selection.textFree ?? null,
      }))

      const { error } = await supabase.from("respuestas_opciones_seleccionadas").insert(rows)

      if (error) throw error
    }
  }

  return detail
}