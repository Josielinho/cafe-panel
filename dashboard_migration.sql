-- Ejecuta esto en Supabase SQL Editor para ayudar al dashboard.
-- No rompe la encuesta actual.

create index if not exists idx_respuestas_encuesta_fecha
  on public.respuestas_encuesta (fecha_respuesta desc);

create index if not exists idx_respuestas_encuesta_encuesta_fecha
  on public.respuestas_encuesta (encuesta_id, fecha_respuesta desc);

create index if not exists idx_respuestas_detalle_pregunta
  on public.respuestas_detalle (pregunta_id);

create index if not exists idx_respuestas_detalle_respuesta
  on public.respuestas_detalle (respuesta_encuesta_id);

create index if not exists idx_respuestas_opciones_detalle
  on public.respuestas_opciones_seleccionadas (respuesta_detalle_id);

create or replace view public.v_respuestas_analiticas as
select
  re.id as respuesta_encuesta_id,
  re.encuesta_id,
  re.fecha_respuesta,
  rd.id as respuesta_detalle_id,
  rd.pregunta_id,
  pe.codigo_pregunta,
  pe.texto_pregunta,
  pe.tipo_pregunta,
  rd.respuesta_texto,
  rd.respuesta_numero,
  rd.respuesta_booleano,
  rd.respuesta_fecha
from public.respuestas_encuesta re
join public.respuestas_detalle rd
  on rd.respuesta_encuesta_id = re.id
join public.preguntas_encuesta pe
  on pe.id = rd.pregunta_id;
