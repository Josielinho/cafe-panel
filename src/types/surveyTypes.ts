export interface Encuesta {
  id: string;
  titulo: string;
  descripcion: string;
  estado: string;
}

export interface SeccionEncuesta {
  id: string;
  encuesta_id: string;
  titulo: string;
  descripcion: string;
  posicion: number;
}

export interface PreguntaEncuesta {
  id: string;
  encuesta_id: string;
  seccion_id: string;
  codigo_pregunta: string;
  texto_pregunta: string;
  tipo_pregunta: TipoPregunta;
  posicion: number;
  es_obligatoria: boolean;
}

export type TipoPregunta =
  | 'texto_corto'
  | 'texto_largo'
  | 'numero'
  | 'booleano'
  | 'opcion_unica'
  | 'opcion_multiple';

export interface OpcionPregunta {
  id: string;
  pregunta_id: string;
  valor_opcion: string;
  etiqueta_opcion: string;
  posicion: number;
  permite_texto_libre: boolean;
}

export interface RespuestaEncuesta {
  id?: string;
  encuesta_id: string;
  encuestado_id: string;
  fecha_respuesta?: string;
}

export interface RespuestaDetalle {
  id?: string;
  respuesta_encuesta_id: string;
  pregunta_id: string;
  respuesta_texto: string | null;
  respuesta_numero: number | null;
  respuesta_booleano: boolean | null;
}

export interface RespuestaOpcionSeleccionada {
  id?: string;
  respuesta_detalle_id: string;
  opcion_id: string;
  texto_libre: string | null;
}

export interface PreguntaConOpciones extends PreguntaEncuesta {
  opciones: OpcionPregunta[];
  seccion: SeccionEncuesta;
}

export interface SurveyData {
  encuesta: Encuesta;
  secciones: SeccionEncuesta[];
  preguntas: PreguntaConOpciones[];
}

export interface RespuestaUsuario {
  pregunta_id: string;
  tipo: TipoPregunta;
  texto?: string;
  numero?: number;
  booleano?: boolean;
  opciones_seleccionadas?: {
    opcion_id: string;
    texto_libre?: string;
  }[];
}
