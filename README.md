# Survey Admin Pro

Aplicación administrativa independiente para encuestas conectada a la misma base de datos de Supabase.

## Qué trae

- panel separado de la encuesta pública
- inicio claro para usuarios no técnicos
- módulo de analítica con filtros por encuesta y fecha
- tarjetas por cada pregunta con estadísticas
- lista de personas encuestadas por pregunta
- modal para ver todo lo que respondió una persona
- módulo CRUD de encuestas
- creación y edición de preguntas y opciones
- control de estado: borrador o publicada
- protección de estructura cuando una encuesta ya tiene respuestas

## Cómo correrlo

```bash
npm install
npm run dev
```

## Variables de entorno

Usa estas variables en `.env`:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Rutas principales

- `/` inicio
- `/analitica` resultados y análisis
- `/encuestas` administración y CRUD
