import { supabase } from '../lib/supabaseClient';

export async function fetchSurvey(encuestaId: string) {
  const { data, error } = await supabase
    .from('encuestas')
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
          reglas_validacion,
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
    .eq('id', encuestaId)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchPublishedSurveys() {
  const { data, error } = await supabase
    .from('encuestas')
    .select('id, titulo, descripcion, estado, fecha_creacion, logo_url')
    .eq('estado', 'publicada')
    .order('fecha_creacion', { ascending: false });

  if (error) throw error;
  return data;
}
