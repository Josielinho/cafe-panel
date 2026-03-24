export type SingleChoiceAnswer = {
  type: 'single_choice';
  optionId: string;
  value: string;
  textFree?: string;
};

export type MultipleChoiceAnswer = {
  type: 'multiple_choice';
  selections: Array<{
    optionId: string;
    value: string;
    textFree?: string;
  }>;
};

export type AnswerValue = string | number | boolean | SingleChoiceAnswer | MultipleChoiceAnswer;

export type RuleCondition = {
  codigo_pregunta: string;
  operador?: '=' | '!=' | 'in' | 'contains';
  valor: unknown;
};

export type ValidationRules = {
  visible_si?: RuleCondition;
  visible_si_cualquiera?: RuleCondition[];
  visible_si_todas?: RuleCondition[];
  obligatoria_si?: RuleCondition;
  obligatoria_si_cualquiera?: RuleCondition[];
  obligatoria_si_todas?: RuleCondition[];
  patron?: string;
  mensaje?: string;
  min?: number;
  max?: number;
};

function getComparableAnswerValue(answer: AnswerValue | undefined): unknown {
  if (typeof answer === 'string' || typeof answer === 'number' || typeof answer === 'boolean') {
    return answer;
  }

  if (answer && typeof answer === 'object' && 'type' in answer) {
    if (answer.type === 'single_choice') {
      return answer.value;
    }

    if (answer.type === 'multiple_choice') {
      return answer.selections.map((selection) => selection.value);
    }
  }

  return undefined;
}

export function evaluateCondition(
  condition: RuleCondition,
  answersByCode: Record<string, AnswerValue | undefined>
): boolean {
  const actualValue = getComparableAnswerValue(answersByCode[condition.codigo_pregunta]);
  const operator = condition.operador ?? '=';

  switch (operator) {
    case '=':
      return actualValue === condition.valor;
    case '!=':
      return actualValue !== condition.valor;
    case 'in':
      return Array.isArray(condition.valor) && condition.valor.includes(actualValue);
    case 'contains':
      return Array.isArray(actualValue) && actualValue.includes(condition.valor as never);
    default:
      return false;
  }
}

export function isQuestionVisible(
  question: { reglas_validacion?: ValidationRules | null },
  answersByCode: Record<string, AnswerValue | undefined>
): boolean {
  const rules = question.reglas_validacion;

  if (!rules) return true;

  if (rules.visible_si && !evaluateCondition(rules.visible_si, answersByCode)) {
    return false;
  }

  if (rules.visible_si_todas && !rules.visible_si_todas.every((rule) => evaluateCondition(rule, answersByCode))) {
    return false;
  }

  if (rules.visible_si_cualquiera && !rules.visible_si_cualquiera.some((rule) => evaluateCondition(rule, answersByCode))) {
    return false;
  }

  return true;
}

export function isQuestionRequired(
  question: { es_obligatoria?: boolean; reglas_validacion?: ValidationRules | null },
  answersByCode: Record<string, AnswerValue | undefined>
): boolean {
  const rules = question.reglas_validacion;

  if (!rules) return !!question.es_obligatoria;

  if (rules.obligatoria_si && evaluateCondition(rules.obligatoria_si, answersByCode)) {
    return true;
  }

  if (rules.obligatoria_si_todas && rules.obligatoria_si_todas.every((rule) => evaluateCondition(rule, answersByCode))) {
    return true;
  }

  if (rules.obligatoria_si_cualquiera && rules.obligatoria_si_cualquiera.some((rule) => evaluateCondition(rule, answersByCode))) {
    return true;
  }

  return !!question.es_obligatoria;
}
