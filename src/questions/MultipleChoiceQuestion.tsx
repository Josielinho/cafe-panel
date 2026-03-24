import { useState, useEffect } from 'react';
import { OptionButton } from '@/components/OptionButton';
import type { PreguntaConOpciones, RespuestaUsuario } from '@/types/surveyTypes';

interface MultipleChoiceQuestionProps {
  pregunta: PreguntaConOpciones;
  respuesta?: RespuestaUsuario;
  onAnswer: (r: RespuestaUsuario) => void;
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function MultipleChoiceQuestion({ pregunta, respuesta, onAnswer }: MultipleChoiceQuestionProps) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(respuesta?.opciones_seleccionadas?.map((o) => o.opcion_id) ?? [])
  );
  const [freeTexts, setFreeTexts] = useState<Record<string, string>>({});

  useEffect(() => {
    setSelected(new Set(respuesta?.opciones_seleccionadas?.map((o) => o.opcion_id) ?? []));
  }, [respuesta, pregunta.id]);

  const toggle = (opcionId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(opcionId)) next.delete(opcionId);
      else next.add(opcionId);

      const opciones = Array.from(next).map((id) => ({
        opcion_id: id,
        texto_libre: freeTexts[id],
      }));
      onAnswer({
        pregunta_id: pregunta.id,
        tipo: 'opcion_multiple',
        opciones_seleccionadas: opciones,
      });
      return next;
    });
  };

  const handleFreeText = (opcionId: string, text: string) => {
    setFreeTexts((prev) => ({ ...prev, [opcionId]: text }));
    const opciones = Array.from(selected).map((id) => ({
      opcion_id: id,
      texto_libre: id === opcionId ? text : freeTexts[id],
    }));
    onAnswer({
      pregunta_id: pregunta.id,
      tipo: 'opcion_multiple',
      opciones_seleccionadas: opciones,
    });
  };

  return (
    <div className="space-y-3">
      {pregunta.opciones.map((op, i) => (
        <div key={op.id}>
          <OptionButton
            label={op.etiqueta_opcion}
            letter={LETTERS[i]}
            selected={selected.has(op.id)}
            onClick={() => toggle(op.id)}
          />
          {op.permite_texto_libre && selected.has(op.id) && (
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
      <p className="text-sm text-muted-foreground mt-2">Puedes seleccionar varias opciones</p>
    </div>
  );
}
