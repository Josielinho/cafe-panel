# Panel administrativo actualizado

## Nueva organización
- `/dashboard`
- Navegación lateral con dos áreas:
  - `Analítica`
  - `Encuestas`

## Analítica
- Filtros por fecha y encuesta
- KPIs ejecutivos
- Tendencia por día
- Detección de picos de actividad
- Comparativo por encuesta
- **Todas las preguntas analizadas en cards separadas**
- Cada card muestra:
  - título de la pregunta
  - tipo
  - total respondido
  - distribución estadística
  - respuestas recientes

## Gestión de encuestas
- CRUD desde el panel
- Crear encuesta nueva
- Editar encuesta existente
- Cambiar estado entre `borrador` y `publicada`
- Administrar preguntas
- Administrar opciones para selección única o múltiple
- Eliminar encuesta cuando no tiene respuestas

## Regla de seguridad importante
Si una encuesta ya tiene respuestas registradas:
- el panel permite actualizar datos generales
- pero protege la estructura de preguntas para no dañar el histórico

## Archivos clave
- `src/pages/DashboardPage.tsx`
- `src/services/dashboardService.ts`
- `src/types/dashboardTypes.ts`
- `src/lib/dashboardAnalytics.ts`
- `dashboard_migration.sql`

## Importante
Si el panel no carga datos, revisa RLS en Supabase. El rol anónimo debe poder leer:
- `encuestas`
- `preguntas_encuesta`
- `opciones_pregunta`
- `respuestas_encuesta`
- `respuestas_detalle`
- `respuestas_opciones_seleccionadas`

Y para el CRUD debe poder escribir en:
- `encuestas`
- `secciones_encuesta`
- `preguntas_encuesta`
- `opciones_pregunta`
