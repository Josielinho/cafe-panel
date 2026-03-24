import { useState } from 'react';
import { OptionButton } from '@/components/OptionButton';
import type { PreguntaConOpciones, RespuestaUsuario } from '@/types/surveyTypes';

interface SingleChoiceQuestionProps {
  pregunta: PreguntaConOpciones;
  respuesta?: RespuestaUsuario;
  onAnswer: (r: RespuestaUsuario) => void;
  onNext: () => void;
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function SingleChoiceQuestion({ pregunta, respuesta, onAnswer, onNext }: SingleChoiceQuestionProps) {
  const selectedId = respuesta?.opciones_seleccionadas?.[0]?.opcion_id;
  const [freeTexts, setFreeTexts] = useState<Record<string, string>>({});

  const handleSelect = (opcionId: string) => {
    const opcion = pregunta.opciones.find((o) => o.id === opcionId);
    onAnswer({
      pregunta_id: pregunta.id,
      tipo: 'opcion_unica',
      opciones_seleccionadas: [
        {
          opcion_id: opcionId,
          texto_libre: opcion?.permite_texto_libre ? freeTexts[opcionId] : undefined,
        },
      ],
    });
    if (!opcion?.permite_texto_libre) {
      setTimeout(onNext, 350);
    }
  };

  const handleFreeText = (opcionId: string, text: string) => {
    setFreeTexts((prev) => ({ ...prev, [opcionId]: text }));
    if (selectedId === opcionId) {
      onAnswer({
        pregunta_id: pregunta.id,
        tipo: 'opcion_unica',
        opciones_seleccionadas: [{ opcion_id: opcionId, texto_libre: text }],
      });
    }
  };

  return (
    <div className="space-y-3">
      {pregunta.opciones.map((op, i) => (
        <div key={op.id}>
          <OptionButton
            label={op.etiqueta_opcion}
            letter={LETTERS[i]}
            selected={selectedId === op.id}
            onClick={() => handleSelect(op.id)}
          />
          {op.permite_texto_libre && selectedId === op.id && (
            <input
              type="text"
              value={freeTexts[op.id] ?? ''}
              onChange={(e) => handleFreeText(op.id, e.target.value)}
              placeholder="Especifica aquí..."
              className="mt-2 ml-11 w-[calc(100%-2.75rem)] rounded-lg border-2 border-input bg-background px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
              autoFocus
            />
          )}
        </div>
      ))}
    </div>
  );
}
