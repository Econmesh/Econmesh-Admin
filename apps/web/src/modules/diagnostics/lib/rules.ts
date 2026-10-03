/**
 * Avaliação genérica do catálogo no cliente — apenas para feedback imediato
 * (visibilidade condicional e contagem de progresso). Não contém regras de
 * negócio próprias: tudo vem da configuração do catálogo, e o backend
 * recalcula progresso e pontuação a cada salvamento.
 */
import type {
  AnswerValue,
  DiagnosticCatalog,
  DiagnosticQuestion,
  DiagnosticStep,
} from "@/services/dmc/diagnostics.service";

export type AnswerMap = Record<string, AnswerValue>;

export function isAnswered(value: AnswerValue | undefined): boolean {
  if (value == null) return false;
  if (Array.isArray(value)) return value.length > 0;
  return value.trim().length > 0;
}

export function isQuestionVisible(question: DiagnosticQuestion, values: AnswerMap): boolean {
  return question.show_if.every((condition) => {
    const current = values[condition.question_id];
    if (condition.operator === "in") {
      return typeof current === "string" && condition.values.includes(current);
    }
    if (condition.operator === "contains_any") {
      return Array.isArray(current) && current.some((item) => condition.values.includes(item));
    }
    return true;
  });
}

/** Ids visíveis, resolvendo dependências encadeadas (mesma regra do backend). */
export function visibleQuestionIds(catalog: DiagnosticCatalog, values: AnswerMap): Set<string> {
  const effective: AnswerMap = {};
  const visible = new Set<string>();
  for (const question of catalog.questions) {
    if (isQuestionVisible(question, effective)) {
      visible.add(question.id);
      effective[question.id] = values[question.id] ?? null;
    }
  }
  return visible;
}

/** Perguntas com resposta que deixariam de ser aplicáveis após a mudança. */
export function answersHiddenByChange(
  catalog: DiagnosticCatalog,
  values: AnswerMap,
  questionId: string,
  nextValue: AnswerValue,
): DiagnosticQuestion[] {
  const before = visibleQuestionIds(catalog, values);
  const after = visibleQuestionIds(catalog, { ...values, [questionId]: nextValue });
  return catalog.questions.filter(
    (question) =>
      before.has(question.id) && !after.has(question.id) && isAnswered(values[question.id]),
  );
}

export type LocalStepProgress = {
  requiredTotal: number;
  requiredAnswered: number;
  optionalTotal: number;
  optionalAnswered: number;
  notApplicable: number;
  percent: number;
  missing: string[];
};

export function stepProgress(
  catalog: DiagnosticCatalog,
  step: DiagnosticStep,
  values: AnswerMap,
  visible = visibleQuestionIds(catalog, values),
): LocalStepProgress {
  const progress: LocalStepProgress = {
    requiredTotal: 0,
    requiredAnswered: 0,
    optionalTotal: 0,
    optionalAnswered: 0,
    notApplicable: 0,
    percent: 0,
    missing: [],
  };
  for (const question of catalog.questions) {
    if (question.step_id !== step.id) continue;
    if (!visible.has(question.id)) {
      progress.notApplicable += 1;
      continue;
    }
    const answered = isAnswered(values[question.id]);
    if (question.required) {
      progress.requiredTotal += 1;
      if (answered) progress.requiredAnswered += 1;
      else progress.missing.push(question.id);
    } else {
      progress.optionalTotal += 1;
      if (answered) progress.optionalAnswered += 1;
    }
  }
  progress.percent =
    progress.requiredTotal === 0
      ? 100
      : Math.round((progress.requiredAnswered * 100) / progress.requiredTotal);
  return progress;
}

export function overallProgress(catalog: DiagnosticCatalog, values: AnswerMap): number {
  const visible = visibleQuestionIds(catalog, values);
  let total = 0;
  let done = 0;
  for (const step of catalog.steps) {
    if (step.availability !== "available") continue;
    const progress = stepProgress(catalog, step, values, visible);
    total += progress.requiredTotal;
    done += progress.requiredAnswered;
  }
  return total === 0 ? 100 : Math.round((done * 100) / total);
}

export function questionLabel(question: DiagnosticQuestion): string {
  return question.code ? `${question.code} ${question.label}` : question.label;
}

const dateTimeFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** ``DD/MM/YYYY HH:mm`` */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return dateTimeFormat.format(date).replace(",", "");
}

export const STATUS_LABELS: Record<string, string> = {
  not_started: "Não iniciado",
  in_progress: "Em andamento",
  completed: "Concluído",
  review: "Em revisão",
  archived: "Arquivado",
};

export function formatCnpj(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length !== 14) return value;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}
