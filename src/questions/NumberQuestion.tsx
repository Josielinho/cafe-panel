import { useState, useEffect } from 'react';
import type { PreguntaConOpciones, RespuestaUsuario } from '@/types/surveyTypes';

interface NumberQuestionProps {
  pregunta: PreguntaConOpciones;
  respuesta?: RespuestaUsuario;
  onAnswer: (r: RespuestaUsuario) => void;
  onNext: () => void;
}

export function NumberQuestion({ pregunta, respuesta, onAnswer, onNext }: NumberQuestionProps) {
  const [value, setValue] = useState(respuesta?.numero?.toString() ?? '');

  useEffect(() => {
    setValue(respuesta?.numero?.toString() ?? '');
  }, [respuesta, pregunta.id]);

  const handleChange = (val: string) => {
    setValue(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      onAnswer({ pregunta_id: pregunta.id, tipo: 'numero', numero: num });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) {
      onNext();
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="number"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="0"
        className="w-full rounded-xl border-2 border-input bg-background px-5 py-4 text-base focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
        autoFocus
      />
      <p className="text-sm text-muted-foreground">
        Presiona <kbd className="px-2 py-0.5 rounded bg-muted font-mono text-xs">Enter ↵</kbd> para continuar
      </p>
    </div>
  );
}
