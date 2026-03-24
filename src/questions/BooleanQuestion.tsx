import { OptionButton } from '@/components/OptionButton';
import type { PreguntaConOpciones, RespuestaUsuario } from '@/types/surveyTypes';

interface BooleanQuestionProps {
  pregunta: PreguntaConOpciones;
  respuesta?: RespuestaUsuario;
  onAnswer: (r: RespuestaUsuario) => void;
  onNext: () => void;
}

export function BooleanQuestion({ pregunta, respuesta, onAnswer, onNext }: BooleanQuestionProps) {
  const handleSelect = (val: boolean) => {
    onAnswer({ pregunta_id: pregunta.id, tipo: 'booleano', booleano: val });
    setTimeout(onNext, 350);
  };

  return (
    <div className="space-y-3">
      <OptionButton
        label="Sí"
        letter="Y"
        selected={respuesta?.booleano === true}
        onClick={() => handleSelect(true)}
      />
      <OptionButton
        label="No"
        letter="N"
        selected={respuesta?.booleano === false}
        onClick={() => handleSelect(false)}
      />
    </div>
  );
}
