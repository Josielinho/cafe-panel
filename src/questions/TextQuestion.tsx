import { useState, useEffect } from 'react';
import type { PreguntaConOpciones, RespuestaUsuario } from '@/types/surveyTypes';

interface TextQuestionProps {
  pregunta: PreguntaConOpciones;
  respuesta?: RespuestaUsuario;
  onAnswer: (r: RespuestaUsuario) => void;
  onNext: () => void;
}

export function TextQuestion({ pregunta, respuesta, onAnswer, onNext }: TextQuestionProps) {
  const [value, setValue] = useState(respuesta?.texto ?? '');
  const isLong = pregunta.tipo_pregunta === 'texto_largo';

  useEffect(() => {
    setValue(respuesta?.texto ?? '');
  }, [respuesta, pregunta.id]);

  const handleChange = (val: string) => {
    setValue(val);
    onAnswer({ pregunta_id: pregunta.id, tipo: pregunta.tipo_pregunta, texto: val });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLong && value.trim()) {
      onNext();
    }
  };

  return (
    <div className="space-y-4">
      {isLong ? (
        <textarea
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Escribe tu respuesta aquí..."
          rows={4}
          className="w-full rounded-xl border-2 border-input bg-background px-5 py-4 text-base focus:outline-none focus:border-primary transition-colors resize-none placeholder:text-muted-foreground"
          autoFocus
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe tu respuesta aquí..."
          className="w-full rounded-xl border-2 border-input bg-background px-5 py-4 text-base focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
          autoFocus
        />
      )}
      {!isLong && (
        <p className="text-sm text-muted-foreground">
          Presiona <kbd className="px-2 py-0.5 rounded bg-muted font-mono text-xs">Enter ↵</kbd> para continuar
        </p>
      )}
    </div>
  );
}
