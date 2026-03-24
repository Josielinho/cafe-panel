import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CircleAlert, LoaderCircle } from 'lucide-react';
import { fetchSurvey } from '../services/surveyService';
import { createResponse, saveAnswer } from '../services/responseService';
import QuestionRenderer from './QuestionRenderer';
import ProgressBar from './ProgressBar';
import ThankYouScreen from './ThankYouScreen';
import { type AnswerValue, isQuestionRequired, isQuestionVisible } from '../lib/surveyRules';

type SurveyQuestion = {
  id: string;
  codigo_pregunta: string;
  texto_pregunta: string;
  tipo_pregunta:
    | 'texto_corto'
    | 'texto_largo'
    | 'numero'
    | 'booleano'
    | 'opcion_unica'
    | 'opcion_multiple';
  posicion: number;
  es_obligatoria: boolean;
  reglas_validacion?: Record<string, unknown> | null;
  seccion_titulo?: string;
  opciones_pregunta?: Array<{
    id: string;
    valor_opcion: string;
    etiqueta_opcion: string;
    posicion: number;
    permite_texto_libre?: boolean;
  }>;
};

type SurveyResponse = {
  id: string;
};

type SurveyData = {
  titulo?: string | null;
  descripcion?: string | null;
  logo_url?: string | null;
  secciones_encuesta: Array<{
    titulo: string;
    posicion: number;
    preguntas_encuesta: SurveyQuestion[];
  }>;
};

const FALLBACK_SURVEY_ID = import.meta.env.VITE_DEFAULT_SURVEY_ID as string | undefined;

function cleanQuestionText(text: string) {
  return text.replace(/^\s*\d+[.)-]?\s*/, '').trim();
}

export default function SurveyContainer() {
  const { id: routeSurveyId } = useParams();
  const surveyId = routeSurveyId ?? FALLBACK_SURVEY_ID;

  const [surveyTitle, setSurveyTitle] = useState('');
  const [surveyDescription, setSurveyDescription] = useState('');
  const [surveyLogo, setSurveyLogo] = useState<string>('/acaro-logo.png');
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [answersByCode, setAnswersByCode] = useState<Record<string, AnswerValue | undefined>>({});
  const [index, setIndex] = useState(0);
  const [responseId, setResponseId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [done, setDone] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();

  const visibleQuestions = useMemo(() => {
    return questions.filter((question) => isQuestionVisible(question, answersByCode));
  }, [questions, answersByCode]);

  useEffect(() => {
    void loadSurvey();
  }, [surveyId]);

  async function loadSurvey() {
    if (!surveyId) {
      setError('No se encontró un identificador de encuesta. Abre la encuesta desde la lista principal.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(undefined);
      setSaveError(undefined);
      setDone(false);
      setAnswersByCode({});
      setIndex(0);

      const data = (await fetchSurvey(surveyId)) as SurveyData;

      const flat = data.secciones_encuesta
        .sort((a, b) => a.posicion - b.posicion)
        .flatMap((section) =>
          [...section.preguntas_encuesta]
            .sort((a, b) => a.posicion - b.posicion)
            .map((question) => ({
              ...question,
              seccion_titulo: section.titulo,
            }))
        );

      setSurveyTitle(data.titulo ?? 'Encuesta');
      setSurveyDescription(data.descripcion ?? '');
      setSurveyLogo(data.logo_url || '/acaro-logo.png');
      setQuestions(flat);

      const resp = (await createResponse(surveyId)) as SurveyResponse;
      setResponseId(resp.id);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setError('No fue posible cargar la encuesta. Verifica la conexión y vuelve a intentarlo.');
      setLoading(false);
    }
  }

  function isEmptyAnswer(value: AnswerValue) {
    if (typeof value === 'string') return !value.trim();
    if (typeof value === 'number') return Number.isNaN(value);
    if (typeof value === 'boolean') return false;

    if (typeof value === 'object' && value !== null && 'type' in value) {
      if (value.type === 'single_choice') {
        return !value.optionId;
      }

      if (value.type === 'multiple_choice') {
        return value.selections.length === 0;
      }
    }

    return true;
  }

  async function answer(value: AnswerValue) {
    const q = visibleQuestions[index];

    if (!q || isSaving) return;

    const required = isQuestionRequired(q, answersByCode);

    if (required && isEmptyAnswer(value)) {
      setSaveError('Esta pregunta es obligatoria antes de continuar.');
      return;
    }

    if (!responseId) {
      setSaveError('No se encontró una sesión de respuesta activa. Recarga la página e intenta nuevamente.');
      return;
    }

    const nextAnswers = {
      ...answersByCode,
      [q.codigo_pregunta]: value,
    };

    try {
      setIsSaving(true);
      setSaveError(undefined);
      await saveAnswer(responseId, q.id, value);
      setAnswersByCode(nextAnswers);

      const nextVisibleQuestions = questions.filter((question) => isQuestionVisible(question, nextAnswers));
      const currentVisibleIndex = nextVisibleQuestions.findIndex((question) => question.id === q.id);
      const nextIndex = currentVisibleIndex + 1;

      if (nextIndex >= nextVisibleQuestions.length) {
        setDone(true);
        return;
      }

      setIndex(nextIndex);
    } catch (e) {
      console.error(e);
      setSaveError('No se pudo guardar la respuesta en este momento. Intenta nuevamente.');
    } finally {
      setIsSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen px-6 py-12 text-stone-900">
        <div className="mx-auto flex min-h-[80vh] max-w-5xl items-center justify-center">
          <div className="flex items-center gap-3 rounded-2xl border border-[#decebb] bg-white px-5 py-4 text-[#6f5849] shadow-sm">
            <LoaderCircle className="h-5 w-5 animate-spin text-[#2d5b3c]" />
            Cargando formulario...
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen px-6 py-12 text-stone-900">
        <div className="mx-auto flex min-h-[80vh] max-w-3xl items-center justify-center">
          <section className="w-full rounded-[28px] border border-rose-200 bg-white p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
                <CircleAlert className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-2xl font-semibold text-[#3e291f]">No se pudo abrir la encuesta</h1>
                <p className="mt-2 text-[#6f5849]">{error}</p>
                <Link
                  to="/"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#2d5b3c] hover:text-[#234730]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver al inicio
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (done || visibleQuestions.length === 0) {
    return <ThankYouScreen />;
  }

  const q = visibleQuestions[index] ?? visibleQuestions[0];
  const currentPosition = visibleQuestions.findIndex((question) => question.id === q.id) + 1;
  const currentSection = q.seccion_titulo ?? 'Sección actual';

  return (
    <main className="min-h-screen px-4 py-6 text-stone-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-[#decebb] bg-white px-4 py-2 text-sm font-medium text-[#6f5849] transition hover:border-[#cbb08a] hover:bg-[#faf7f1]"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al listado
          </Link>

          <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-[#d5c0a0] bg-[#f4ecdf] px-4 py-2 text-sm font-medium text-[#2d5b3c]">
            <img src={surveyLogo} alt={`Logo de ${surveyTitle}`} className="h-6 w-auto" />
            {surveyTitle}
          </div>
        </div>

        <section className="overflow-hidden rounded-[32px] border border-[#d8c9b5] bg-white/95 shadow-[0_30px_80px_-45px_rgba(78,52,38,0.35)]">
          <div className="border-b border-[#eadfce] px-5 py-6 sm:px-8 sm:py-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#2d5b3c]">
              Formulario
            </p>

            <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-[#3e291f] sm:text-4xl">
              {surveyTitle}
            </h1>

            {surveyDescription ? (
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6f5849] sm:text-base">
                {surveyDescription}
              </p>
            ) : null}

            <div className="mt-6">
              <ProgressBar current={currentPosition} total={visibleQuestions.length} label="Avance del formulario" />
            </div>
          </div>

          <div className="px-5 py-6 sm:px-8 sm:py-8">
            <div className="rounded-[28px] border border-[#e7ddd0] bg-[#fcfaf6] p-5 sm:p-7">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#8a725d] ring-1 ring-[#e7ddd0]">
                  {currentSection}
                </span>
                <span className="rounded-full bg-[#eef5ef] px-3 py-1 text-xs font-semibold text-[#2d5b3c] ring-1 ring-[#cddfcf]">
                  Pregunta {currentPosition} de {visibleQuestions.length}
                </span>
              </div>

              <h2 className="mb-6 text-2xl font-semibold leading-tight tracking-tight text-[#3e291f] sm:text-3xl">
                {cleanQuestionText(q.texto_pregunta)}
              </h2>

              {saveError ? (
                <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {saveError}
                </div>
              ) : null}

              <div className="space-y-6">
                <QuestionRenderer key={q.id} question={q} onAnswer={answer} isSubmitting={isSaving} />

                <div className="border-t border-[#e7ddd0] pt-4 text-sm text-[#7a6659]">
                  {isSaving ? 'Guardando respuesta...' : 'La respuesta se registra antes de continuar.'}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}