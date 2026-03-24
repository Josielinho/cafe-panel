import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronRight, Circle, FileText, Hash, MessageSquareText, Phone } from 'lucide-react';

interface OpcionPregunta {
  id: string;
  valor_opcion: string;
  etiqueta_opcion: string;
  posicion: number;
  permite_texto_libre?: boolean;
}

interface Question {
  id: string;
  codigo_pregunta?: string;
  texto_pregunta: string;
  tipo_pregunta:
    | 'texto_corto'
    | 'texto_largo'
    | 'numero'
    | 'booleano'
    | 'opcion_unica'
    | 'opcion_multiple';
  opciones_pregunta?: OpcionPregunta[];
}

type SingleChoiceAnswer = {
  type: 'single_choice';
  optionId: string;
  value: string;
  textFree?: string;
};

type MultipleChoiceAnswer = {
  type: 'multiple_choice';
  selections: Array<{
    optionId: string;
    value: string;
    textFree?: string;
  }>;
};

type AnswerValue = string | number | boolean | SingleChoiceAnswer | MultipleChoiceAnswer;

interface Props {
  question: Question;
  onAnswer: (value: AnswerValue) => Promise<void> | void;
  isSubmitting?: boolean;
}

const inputClassName =
  'w-full rounded-2xl border border-[#decebb] bg-white px-4 py-3.5 text-base text-[#3e291f] outline-none transition placeholder:text-[#9b8777] focus:border-[#2d5b3c] focus:ring-4 focus:ring-[#d7ead8] disabled:cursor-not-allowed disabled:bg-[#f6f1ea]';

const primaryButtonClassName =
  'inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2d5b3c] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4c3428] disabled:cursor-not-allowed disabled:bg-[#b8a99a]';

const cardButtonBaseClassName =
  'w-full rounded-2xl border px-4 py-4 text-left transition duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d7ead8] disabled:cursor-not-allowed disabled:opacity-60';

function isPhoneQuestion(question: Question) {
  const code = (question.codigo_pregunta ?? '').toLowerCase();
  const text = question.texto_pregunta.toLowerCase();
  return code.includes('telefono') || code.includes('tel') || text.includes('teléfono') || text.includes('telefono');
}

function isAgeQuestion(question: Question) {
  const code = (question.codigo_pregunta ?? '').toLowerCase();
  const text = question.texto_pregunta.toLowerCase();
  return code.includes('edad') || text.includes('edad');
}

function formatPhoneValue(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

function getPhoneError(value: string) {
  if (!value.trim()) return 'El número de teléfono es obligatorio.';
  if (!/^\d{4}-\d{4}$/.test(value)) return 'Use el formato xxxx-xxxx.';
  return '';
}

function getAgeError(rawValue: string) {
  if (!rawValue.trim()) return 'La edad es obligatoria.';
  const value = Number(rawValue);
  if (!Number.isFinite(value)) return 'Ingrese una edad válida.';
  if (!Number.isInteger(value)) return 'La edad debe ser un número entero.';
  if (value < 0) return 'La edad no puede ser negativa.';
  if (value > 100) return 'La edad no puede ser mayor a 100 años.';
  return '';
}

export default function QuestionRenderer({ question, onAnswer, isSubmitting = false }: Props) {
  const [textValue, setTextValue] = useState('');
  const [longTextValue, setLongTextValue] = useState('');
  const [numberValue, setNumberValue] = useState('');
  const [selectedSingleId, setSelectedSingleId] = useState<string>('');
  const [selectedMultiIds, setSelectedMultiIds] = useState<string[]>([]);
  const [freeTextByOptionId, setFreeTextByOptionId] = useState<Record<string, string>>({});

  useEffect(() => {
    setTextValue('');
    setLongTextValue('');
    setNumberValue('');
    setSelectedSingleId('');
    setSelectedMultiIds([]);
    setFreeTextByOptionId({});
  }, [question.id]);

  const sortedOptions = useMemo(() => {
    return [...(question.opciones_pregunta ?? [])].sort((a, b) => a.posicion - b.posicion);
  }, [question.opciones_pregunta]);

  const phoneQuestion = isPhoneQuestion(question);
  const ageQuestion = isAgeQuestion(question);

  if (question.tipo_pregunta === 'booleano') {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { label: 'Sí', value: true },
          { label: 'No', value: false },
        ].map((option) => (
          <button
            key={option.label}
            type="button"
            disabled={isSubmitting}
            className={`${cardButtonBaseClassName} border-[#decebb] bg-white hover:border-[#2d5b3c] hover:bg-[#f2f7f2]`}
            onClick={() => onAnswer(option.value)}
          >
            <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#f4ecdf] text-[#2d5b3c]">
              <Check className="h-5 w-5" />
            </span>
            <span className="block text-lg font-semibold text-[#3e291f]">{option.label}</span>
            <span className="mt-1 block text-sm text-[#7a6659]">Selecciona una opción para continuar.</span>
          </button>
        ))}
      </div>
    );
  }

  if (question.tipo_pregunta === 'texto_corto') {
    const phoneError = phoneQuestion ? getPhoneError(textValue) : '';
    const textError = phoneQuestion ? phoneError : '';
    const disabled = isSubmitting || !textValue.trim() || !!textError;

    return (
      <div className="space-y-4">
        <div className="relative">
          {phoneQuestion ? (
            <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9b8777]" />
          ) : (
            <FileText className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9b8777]" />
          )}

          <input
            className={`${inputClassName} pl-12 ${textError ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : ''}`}
            placeholder={phoneQuestion ? 'Ejemplo: 6123-4567' : 'Escribe tu respuesta'}
            value={textValue}
            inputMode={phoneQuestion ? 'numeric' : 'text'}
            maxLength={phoneQuestion ? 9 : undefined}
            disabled={isSubmitting}
            onChange={(e) => {
              const nextValue = phoneQuestion ? formatPhoneValue(e.target.value) : e.target.value;
              setTextValue(nextValue);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && textValue.trim() && !textError && !isSubmitting) {
                void onAnswer(textValue.trim());
              }
            }}
          />
        </div>

        {textError ? <p className="text-sm text-rose-700">{textError}</p> : null}

        <button
          type="button"
          className={primaryButtonClassName}
          disabled={disabled}
          onClick={() => onAnswer(textValue.trim())}
        >
          {isSubmitting ? 'Guardando...' : 'Continuar'}
          {!isSubmitting ? <ChevronRight className="h-4 w-4" /> : null}
        </button>
      </div>
    );
  }

  if (question.tipo_pregunta === 'texto_largo') {
    return (
      <div className="space-y-4">
        <div className="relative">
          <MessageSquareText className="pointer-events-none absolute left-4 top-4 h-5 w-5 text-[#9b8777]" />
          <textarea
            className={`${inputClassName} min-h-36 resize-y pl-12`}
            placeholder="Escribe tu respuesta"
            value={longTextValue}
            disabled={isSubmitting}
            onChange={(e) => setLongTextValue(e.target.value)}
          />
        </div>

        <button
          type="button"
          className={primaryButtonClassName}
          disabled={!longTextValue.trim() || isSubmitting}
          onClick={() => onAnswer(longTextValue.trim())}
        >
          {isSubmitting ? 'Guardando...' : 'Continuar'}
          {!isSubmitting ? <ChevronRight className="h-4 w-4" /> : null}
        </button>
      </div>
    );
  }

  if (question.tipo_pregunta === 'numero') {
    const ageError = ageQuestion ? getAgeError(numberValue) : '';
    const disabled = isSubmitting || !numberValue.trim() || !!ageError;

    return (
      <div className="space-y-4">
        <div className="relative">
          <Hash className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9b8777]" />
          <input
            type="number"
            min={ageQuestion ? 0 : undefined}
            max={ageQuestion ? 100 : undefined}
            className={`${inputClassName} pl-12 ${ageError ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : ''}`}
            placeholder={ageQuestion ? 'Ingrese su edad' : 'Escribe un número'}
            value={numberValue}
            disabled={isSubmitting}
            onChange={(e) => setNumberValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && numberValue.trim() && !ageError && !isSubmitting) {
                void onAnswer(Number(numberValue));
              }
            }}
          />
        </div>

        {ageError ? <p className="text-sm text-rose-700">{ageError}</p> : null}

        <button
          type="button"
          className={primaryButtonClassName}
          disabled={disabled}
          onClick={() => onAnswer(Number(numberValue))}
        >
          {isSubmitting ? 'Guardando...' : 'Continuar'}
          {!isSubmitting ? <ChevronRight className="h-4 w-4" /> : null}
        </button>
      </div>
    );
  }

  if (question.tipo_pregunta === 'opcion_unica') {
    const selectedOption = sortedOptions.find((o) => o.id === selectedSingleId);
    const requiresFreeText = !!selectedOption?.permite_texto_libre;
    const freeText = selectedOption ? freeTextByOptionId[selectedOption.id] ?? '' : '';

    return (
      <div className="space-y-3">
        {sortedOptions.map((option) => {
          const isSelected = selectedSingleId === option.id;

          return (
            <div key={option.id} className="space-y-2">
              <button
                type="button"
                className={`${cardButtonBaseClassName} ${
                  isSelected
                    ? 'border-[#2d5b3c] bg-[#f2f7f2] ring-4 ring-[#d7ead8]'
                    : 'border-[#decebb] bg-white hover:border-[#cbb08a] hover:bg-[#faf7f1]'
                }`}
                disabled={isSubmitting}
                onClick={() => {
                  setSelectedSingleId(option.id);

                  if (!option.permite_texto_libre) {
                    void onAnswer({
                      type: 'single_choice',
                      optionId: option.id,
                      value: option.valor_opcion,
                    });
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-1 flex h-5 w-5 items-center justify-center rounded-full border ${
                      isSelected ? 'border-[#2d5b3c] bg-[#2d5b3c] text-white' : 'border-[#b8a99a] text-transparent'
                    }`}
                  >
                    <Circle className="h-2.5 w-2.5 fill-current" />
                  </span>
                  <div>
                    <p className="text-base font-semibold text-[#3e291f]">{option.etiqueta_opcion}</p>
                    {option.permite_texto_libre ? (
                      <p className="mt-1 text-sm text-[#7a6659]">Requiere un detalle adicional.</p>
                    ) : null}
                  </div>
                </div>
              </button>

              {isSelected && option.permite_texto_libre ? (
                <div className="space-y-3 pl-2">
                  <input
                    className={inputClassName}
                    placeholder="Especifica tu respuesta"
                    value={freeTextByOptionId[option.id] ?? ''}
                    disabled={isSubmitting}
                    onChange={(e) =>
                      setFreeTextByOptionId((prev) => ({
                        ...prev,
                        [option.id]: e.target.value,
                      }))
                    }
                  />

                  <button
                    type="button"
                    className={primaryButtonClassName}
                    disabled={isSubmitting || (requiresFreeText && !freeText.trim())}
                    onClick={() =>
                      onAnswer({
                        type: 'single_choice',
                        optionId: option.id,
                        value: option.valor_opcion,
                        textFree: freeText.trim(),
                      })
                    }
                  >
                    {isSubmitting ? 'Guardando...' : 'Continuar'}
                    {!isSubmitting ? <ChevronRight className="h-4 w-4" /> : null}
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  }

  if (question.tipo_pregunta === 'opcion_multiple') {
    return (
      <div className="space-y-3">
        {sortedOptions.map((option) => {
          const isSelected = selectedMultiIds.includes(option.id);

          return (
            <div key={option.id} className="space-y-2">
              <button
                type="button"
                className={`${cardButtonBaseClassName} ${
                  isSelected
                    ? 'border-[#2d5b3c] bg-[#f2f7f2] ring-4 ring-[#d7ead8]'
                    : 'border-[#decebb] bg-white hover:border-[#cbb08a] hover:bg-[#faf7f1]'
                }`}
                disabled={isSubmitting}
                onClick={() => {
                  setSelectedMultiIds((prev) =>
                    prev.includes(option.id) ? prev.filter((id) => id !== option.id) : [...prev, option.id]
                  );
                }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-md border ${
                      isSelected ? 'border-[#2d5b3c] bg-[#2d5b3c] text-white' : 'border-[#b8a99a] bg-white text-transparent'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-base font-semibold text-[#3e291f]">{option.etiqueta_opcion}</p>
                    {option.permite_texto_libre ? (
                      <p className="mt-1 text-sm text-[#7a6659]">Requiere un detalle adicional.</p>
                    ) : null}
                  </div>
                </div>
              </button>

              {isSelected && option.permite_texto_libre ? (
                <input
                  className={`${inputClassName} ml-2`}
                  placeholder="Especifica tu respuesta"
                  value={freeTextByOptionId[option.id] ?? ''}
                  disabled={isSubmitting}
                  onChange={(e) =>
                    setFreeTextByOptionId((prev) => ({
                      ...prev,
                      [option.id]: e.target.value,
                    }))
                  }
                />
              ) : null}
            </div>
          );
        })}

        <button
          type="button"
          className={primaryButtonClassName}
          disabled={
            isSubmitting ||
            selectedMultiIds.length === 0 ||
            sortedOptions.some(
              (option) =>
                selectedMultiIds.includes(option.id) &&
                option.permite_texto_libre &&
                !(freeTextByOptionId[option.id] ?? '').trim()
            )
          }
          onClick={() =>
            onAnswer({
              type: 'multiple_choice',
              selections: sortedOptions
                .filter((option) => selectedMultiIds.includes(option.id))
                .map((option) => ({
                  optionId: option.id,
                  value: option.valor_opcion,
                  textFree: option.permite_texto_libre
                    ? (freeTextByOptionId[option.id] ?? '').trim()
                    : undefined,
                })),
            })
          }
        >
          {isSubmitting ? 'Guardando...' : 'Continuar'}
          {!isSubmitting ? <ChevronRight className="h-4 w-4" /> : null}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
      Tipo de pregunta no soportado: {question.tipo_pregunta}
    </div>
  );
}
