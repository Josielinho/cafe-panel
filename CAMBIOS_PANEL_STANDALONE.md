# Cambios aplicados

## Arquitectura
- El panel quedó como **aplicación independiente**.
- Ya no comparte rutas con la encuesta pública.
- Rutas principales:
  - `/` inicio
  - `/analitica`
  - `/encuestas`

## Analítica
- Vista más clara y más sencilla de entender.
- Filtros por encuesta y fechas.
- KPIs principales.
- Tendencia diaria.
- Picos de actividad.
- Todas las preguntas analizadas en tarjetas separadas.
- Cada tarjeta muestra:
  - título de la pregunta
  - tipo
  - total respondido
  - respuesta dominante
  - cantidad de personas
  - distribución estadística
  - lista de personas encuestadas
- Al hacer clic en una persona, se abre un modal con toda su respuesta.

## Gestión de encuestas
- CRUD de encuestas en un módulo aparte.
- Crear encuesta.
- Editar encuesta.
- Cambiar estado: borrador o publicada.
- Agregar y quitar preguntas.
- Agregar y quitar opciones.
- Bloqueo de estructura cuando la encuesta ya tiene respuestas.

## Diseño
- Organización más seria y profesional.
- Navegación lateral.
- Inicio explicativo para usuarios no técnicos.
- Componentes más ordenados y visualmente consistentes.
