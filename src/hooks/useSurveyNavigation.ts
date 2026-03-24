import { useState, useCallback } from 'react';
import type { PreguntaConOpciones, RespuestaUsuario } from '@/types/surveyTypes';

interface UseSurveyNavigationReturn {
  currentIndex: number;
  isFirst: boolean;
  isLast: boolean;
  isComplete: boolean;
  currentQuestion: PreguntaConOpciones | undefined;
  respuestas: Map<string, RespuestaUsuario>;
  direction: number;
  goNext: () => void;
  goPrev: () => void;
  setRespuesta: (r: RespuestaUsuario) => void;
  finish: () => void;
}

export function useSurveyNavigation(
  preguntas: PreguntaConOpciones[]
): UseSurveyNavigationReturn {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [respuestas, setRespuestas] = useState<Map<string, RespuestaUsuario>>(new Map());
  const [direction, setDirection] = useState(1);

  const currentQuestion = preguntas[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === preguntas.length - 1;

  const goNext = useCallback(() => {
    if (currentIndex < preguntas.length - 1) {
      setDirection(1);
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, preguntas.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  const setRespuesta = useCallback((r: RespuestaUsuario) => {
    setRespuestas((prev) => {
      const next = new Map(prev);
      next.set(r.pregunta_id, r);
      return next;
    });
  }, []);

  const finish = useCallback(() => {
    setIsComplete(true);
  }, []);

  return {
    currentIndex,
    isFirst,
    isLast,
    isComplete,
    currentQuestion,
    respuestas,
    direction,
    goNext,
    goPrev,
    setRespuesta,
    finish,
  };
}
