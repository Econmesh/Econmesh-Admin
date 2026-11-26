/**
 * Avaliação genérica do catálogo no cliente — apenas para feedback imediato
 * (visibilidade condicional e contagem de progresso). Não contém regras de
 * negócio próprias: tudo vem da configuração do catálogo, e o backend
 * recalcula progresso e pontuação a cada salvamento.
 */
import type {
  AnswerValue,
  DiagnosticCatalog,
  DiagnosticItem,
  DiagnosticQuestion,
  DiagnosticStep,
  ItemKind,
} from "@/services/dmc/diagnostics.service";

/** Chave = id da pergunta ou ``<pergunta>@<item>`` (perguntas por item). */
export type AnswerMap = Record<string, AnswerValue>;
export type ItemRef = Pick<DiagnosticItem, "id" | "kind">;

/** Separador entre pergunta e item na chave da resposta (igual ao backend). */
export const ITEM_KEY_SEPARATOR = "@";

export function responseKey(questionId: string, itemId?: string | null): string {
  return itemId ? `${questionId}${ITEM_KEY_SEPARATOR}${itemId}` : questionId;
}

export function splitKey(key: string): { questionId: string; itemId: string | null } {
  const index = key.indexOf(ITEM_KEY_SEPARATOR);
  if (index < 0) return { questionId: key, itemId: null };
  return { questionId: key.slice(0, index), itemId: key.slice(index + 1) || null };
}

export type QuestionInstance = {
  question: DiagnosticQuestion;
  itemId: string | null;
  key: string;
};

export function itemsOf<T extends ItemRef>(items: T[], kind: ItemKind | null): T[] {
  return items.filter((item) => item.kind === kind);
}

/** Instâncias na ordem do catálogo: perguntas por item repetem-se para cada item. */
export function questionInstances(
  catalog: DiagnosticCatalog,
  items: ItemRef[],
): QuestionInstance[] {
  const result: QuestionInstance[] = [];
  for (const question of catalog.questions) {
    if (!question.per_item) {
      result.push({ question, itemId: null, key: question.id });
      continue;
    }
    for (const item of itemsOf(items, question.per_item)) {
      result.push({ question, itemId: item.id, key: responseKey(question.id, item.id) });
    }
  }
  return result;
}

export function isAnswered(value: AnswerValue | undefined): boolean {
  if (value == null) return false;
  if (Array.isArray(value)) return value.length > 0;
  return value.trim().length > 0;
}

export function isInstanceAnswered(
  instance: QuestionInstance,
  values: AnswerMap,
  items: ItemRef[],
): boolean {
  if (instance.question.type === "item_list") {
    return itemsOf(items, instance.question.item_kind).length > 0;
  }
  return isAnswered(values[instance.key]);
}

export function isQuestionVisible(
  question: DiagnosticQuestion,
  values: AnswerMap,
  itemId: string | null = null,
  catalog?: DiagnosticCatalog,
): boolean {
  return question.show_if.every((condition) => {
    const source = catalog?.questions.find((q) => q.id === condition.question_id);
    const key =
      itemId && (!source || source.per_item)
        ? responseKey(condition.question_id, itemId)
        : condition.question_id;
    const current = values[key];
    if (condition.operator === "in") {
      return typeof current === "string" && condition.values.includes(current);
    }
    if (condition.operator === "contains_any") {
      return Array.isArray(current) && current.some((item) => condition.values.includes(item));
    }
    return true;
  });
}

/** Chaves visíveis, resolvendo dependências encadeadas por item (mesma regra do backend). */
export function visibleKeys(
  catalog: DiagnosticCatalog,
  values: AnswerMap,
  items: ItemRef[],
): Set<string> {
  const effective: AnswerMap = {};
  const visible = new Set<string>();
  for (const instance of questionInstances(catalog, items)) {
    if (isQuestionVisible(instance.question, effective, instance.itemId, catalog)) {
      visible.add(instance.key);
      effective[instance.key] = values[instance.key] ?? null;
    }
  }
  return visible;
}

/** Instâncias com resposta que deixariam de ser aplicáveis após a mudança. */
export function answersHiddenByChange(
  catalog: DiagnosticCatalog,
  values: AnswerMap,
  items: ItemRef[],
  key: string,
  nextValue: AnswerValue,
): QuestionInstance[] {
  const before = visibleKeys(catalog, values, items);
  const after = visibleKeys(catalog, { ...values, [key]: nextValue }, items);
  return questionInstances(catalog, items).filter(
    (instance) =>
      before.has(instance.key) && !after.has(instance.key) && isAnswered(values[instance.key]),
  );
}

export type LocalStepProgress = {
  requiredTotal: number;
  requiredAnswered: number;
  optionalTotal: number;
  optionalAnswered: number;
  notApplicable: number;
  percent: number;
  /** Chaves das obrigatórias pendentes. */
  missing: string[];
};

function emptyProgress(): LocalStepProgress {
  return {
    requiredTotal: 0,
    requiredAnswered: 0,
    optionalTotal: 0,
    optionalAnswered: 0,
    notApplicable: 0,
    percent: 0,
    missing: [],
  };
}

function finish(progress: LocalStepProgress): LocalStepProgress {
  progress.percent =
    progress.requiredTotal === 0
      ? 100
      : Math.round((progress.requiredAnswered * 100) / progress.requiredTotal);
  return progress;
}

/** Progresso de um conjunto de instâncias (etapa, seção ou item). */
export function instancesProgress(
  instances: QuestionInstance[],
  values: AnswerMap,
  items: ItemRef[],
  visible: Set<string>,
): LocalStepProgress {
  const progress = emptyProgress();
  for (const instance of instances) {
    if (!visible.has(instance.key)) {
      progress.notApplicable += 1;
      continue;
    }
    const answered = isInstanceAnswered(instance, values, items);
    if (instance.question.required) {
      progress.requiredTotal += 1;
      if (answered) progress.requiredAnswered += 1;
      else progress.missing.push(instance.key);
    } else {
      progress.optionalTotal += 1;
      if (answered) progress.optionalAnswered += 1;
    }
  }
  return finish(progress);
}

export function stepProgress(
  catalog: DiagnosticCatalog,
  step: DiagnosticStep,
  values: AnswerMap,
  items: ItemRef[],
  visible = visibleKeys(catalog, values, items),
): LocalStepProgress {
  return instancesProgress(
    questionInstances(catalog, items).filter((instance) => instance.question.step_id === step.id),
    values,
    items,
    visible,
  );
}

export function overallProgress(
  catalog: DiagnosticCatalog,
  values: AnswerMap,
  items: ItemRef[],
): number {
  const visible = visibleKeys(catalog, values, items);
  let total = 0;
  let done = 0;
  for (const step of catalog.steps) {
    if (step.availability !== "available") continue;
    const progress = stepProgress(catalog, step, values, items, visible);
    total += progress.requiredTotal;
    done += progress.requiredAnswered;
  }
  return total === 0 ? 100 : Math.round((done * 100) / total);
}

/** Progresso de cada item em todas as etapas disponíveis (para o cadastro e as sanfonas). */
export function itemProgress(
  catalog: DiagnosticCatalog,
  values: AnswerMap,
  items: ItemRef[],
  visible: Set<string>,
): Map<string, LocalStepProgress> {
  const available = new Set(
    catalog.steps.filter((step) => step.availability === "available").map((step) => step.id),
  );
  const instances = questionInstances(catalog, items).filter(
    (instance) => instance.itemId && available.has(instance.question.step_id),
  );
  return new Map(
    items.map((item) => [
      item.id,
      instancesProgress(
        instances.filter((instance) => instance.itemId === item.id),
        values,
        items,
        visible,
      ),
    ]),
  );
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
