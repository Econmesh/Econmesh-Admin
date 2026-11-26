import { api } from "@/services/api/client";

/* ------------------------------------------------------------------ catálogo
 * Espelha ``GET /dmc/diagnostics/catalog``. O formulário é renderizado a
 * partir desta configuração — perguntas, opções, pontuação, pilares e regras
 * condicionais vivem no backend.
 */
export type StepAvailability = "available" | "maintenance";
export type QuestionType =
  | "text"
  | "long_text"
  | "email"
  | "phone"
  | "tax_id"
  | "single_choice"
  | "multi_choice"
  /** Cadastro de itens (1.1 produtos, 1.7 resíduos) — via endpoints de itens. */
  | "item_list";
/** Tipos de item cadastráveis no diagnóstico. */
export type ItemKind = "product" | "waste";
export type ConditionOperator = "in" | "contains_any";

export type DiagnosticOption = {
  value: string;
  label: string;
  points: number | null;
  /** Alerta disparado quando a opção é escolhida (ex.: risco crítico). */
  alert_level: "critical" | "warning" | null;
  alert_message: string | null;
};

export type DiagnosticAlert = {
  question_id: string;
  level: "critical" | "warning";
  message: string;
  item_id?: string | null;
};
export type DiagnosticCondition = {
  question_id: string;
  operator: ConditionOperator;
  values: string[];
};

export type DiagnosticQuestion = {
  id: string;
  /** Numeração exibida (reinicia por etapa: ID.1, 1.1, 2.1…). */
  code: string | null;
  /** Número no roteiro original do DMC (referência). */
  number: number | null;
  step_id: string;
  section_id: string;
  label: string;
  type: QuestionType;
  required: boolean;
  placeholder: string | null;
  help_text: string | null;
  max_length: number;
  options: DiagnosticOption[];
  show_if: DiagnosticCondition[];
  scored: boolean;
  pillar_id: string | null;
  pillar_weight: number | null;
  ems_weight: number | null;
  objective: string | null;
  registry_field: string | null;
  read_only: boolean;
  /** Pergunta respondida uma vez para cada item deste tipo. */
  per_item: ItemKind | null;
  /** Para ``item_list``: tipo de item cadastrado. */
  item_kind: ItemKind | null;
};

export type DiagnosticItemReference = {
  kind: ItemKind;
  question_ids: string[];
  title: string;
  description: string | null;
};

export type DiagnosticSection = {
  id: string;
  step_id: string;
  title: string;
  description: string | null;
  /** Reflexo somente leitura, por item, de respostas de outra etapa (ex.: 1.8 no Eixo 3). */
  item_reference: DiagnosticItemReference | null;
};

export type DiagnosticItemKindMeta = {
  kind: ItemKind;
  label: string;
  plural: string;
  list_question_id: string;
  description_label: string;
  max_items: number;
};

export type DiagnosticStep = {
  id: string;
  order: number;
  kind: "identification" | "axis";
  title: string;
  short_title: string;
  description: string | null;
  availability: StepAvailability;
  maintenance_message: string | null;
};

export type DiagnosticPillar = {
  id: string;
  code: string;
  name: string;
  /** Peso do pilar no EMS (%), quando definido. */
  ems_weight: number | null;
};

export type DiagnosticCatalog = {
  version: string;
  steps: DiagnosticStep[];
  sections: DiagnosticSection[];
  questions: DiagnosticQuestion[];
  pillars: DiagnosticPillar[];
  item_kinds: DiagnosticItemKindMeta[];
};

/** Produto (1.1) ou resíduo (1.7) cadastrado no diagnóstico. */
export type DiagnosticItem = {
  id: string;
  kind: ItemKind;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

/* --------------------------------------------------------------- diagnóstico */
export type DiagnosticStatus = "not_started" | "in_progress" | "completed" | "review" | "archived";
export type AnswerValue = string | string[] | null;
export type ResponseSource = "registry" | "agent";

export type DiagnosticResponse = {
  value: AnswerValue;
  score: number | null;
  source: ResponseSource;
  registry_value: string | null;
  updated_at: string;
};

export type StepProgress = {
  step_id: string;
  status: "not_started" | "in_progress" | "completed" | "maintenance";
  required_total: number;
  required_answered: number;
  optional_total: number;
  optional_answered: number;
  not_applicable: number;
  percent: number;
  missing_required: string[];
};

export type PillarScore = {
  pillar_id: string;
  points: number;
  max_points: number;
  percent: number | null;
  answered: number;
  total: number;
};

export type EmsScore = { points: number; max_available: number };

export type QuestionScore = {
  question_id: string;
  step_id: string;
  pillar_id: string | null;
  /** Média dos itens (perguntas gerais: a própria pontuação). */
  points: number | null;
  worst_points: number | null;
  max_points: number;
  ems_weight: number;
  per_item: boolean;
  answered_items: number;
  total_items: number;
  items: { item_id: string; points: number | null }[];
};

export type ScoreSet = {
  aggregation: "average" | "worst";
  pillars: PillarScore[];
  ems: EmsScore;
};

export type DiagnosticEvaluation = {
  steps: StepProgress[];
  progress: number;
  required_total: number;
  required_answered: number;
  pillars: PillarScore[];
  ems: EmsScore;
  complete: boolean;
  /** Chaves visíveis: ``q09`` ou ``q10@<item>`` (perguntas por item). */
  visible_question_ids: string[];
  alerts?: DiagnosticAlert[];
  question_scores?: QuestionScore[];
  /** Mesmo cálculo considerando o pior item de cada pergunta. */
  worst_case?: ScoreSet | null;
};

export type CompanySnapshot = {
  legal_name: string;
  trade_name: string | null;
  tax_id: string;
  sector: string | null;
  city: string | null;
  state: string | null;
};

export type DiagnosticSummary = {
  id: string;
  company_id: string;
  company_name: string;
  company_tax_id: string;
  agent_user_id: string;
  status: DiagnosticStatus;
  progress: number;
  current_step: string | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
  report_generated_at?: string | null;
};

export type DiagnosticDetail = DiagnosticSummary & {
  catalog_version: string;
  company: CompanySnapshot;
  agent_name: string | null;
  /** Chave = id da pergunta ou ``<pergunta>@<item>``. */
  responses: Record<string, DiagnosticResponse>;
  items: DiagnosticItem[];
  evaluation: DiagnosticEvaluation;
  can_edit: boolean;
};

export type DiagnosticCompanyItem = {
  company_id: string;
  legal_name: string;
  trade_name: string | null;
  tax_id: string;
  sector: string | null;
  city: string | null;
  state: string | null;
  registration_status: "pre_registered" | "complete";
  open_diagnostic: DiagnosticSummary | null;
  open_by_other_agent: boolean;
  completed: DiagnosticSummary[];
};

export type AnswerInput = { question_id: string; value: AnswerValue; edited_at?: string };

/* ---------------------------------------------------------------- relatório
 * Espelha ``MaturityReport`` (API). O mesmo documento alimenta a página web
 * e o PDF; ele é gerado uma vez e persistido no diagnóstico.
 */
export type ReportOrigin = "registry" | "adjusted" | "diagnostic";
export type ReportPerson = {
  name: string | null;
  job_title?: string | null;
  email: string | null;
  phone?: string | null;
};
export type ReportAxis = {
  step_id: string;
  order: number;
  title: string;
  short_title: string;
  description: string | null;
  status: "evaluated" | "maintenance";
  percent: number | null;
  points: number;
  max_points: number;
  ems_points: number;
  ems_max: number;
  scored_questions: number;
  reading: string | null;
};
export type ReportPillar = {
  pillar_id: string;
  code: string;
  name: string;
  ems_weight: number | null;
  points: number;
  max_points: number;
  percent: number | null;
  ems_points: number;
  ems_max: number;
  answered: number;
  total: number;
  reading: string | null;
  worst_points?: number | null;
  worst_ems_points?: number | null;
};
export type ReportIndicator = {
  question_id: string;
  code: string | null;
  title: string;
  label: string;
  step_id: string;
  pillar_id: string | null;
  answer: string | null;
  points: number | null;
  max_points: number;
  percent: number | null;
  pillar_weight: number | null;
  ems_weight: number | null;
  ems_points: number | null;
  tier: "high" | "medium" | "low" | "unanswered";
  interpretation: string | null;
  per_item?: boolean;
  worst_points?: number | null;
  items?: {
    item_id: string;
    item_name: string;
    answer: string | null;
    points: number | null;
    tier: "high" | "medium" | "low" | "unanswered";
  }[];
};
export type ReportFinding = {
  title: string;
  text: string;
  severity: "critical" | "high" | "moderate" | null;
  source_question_ids: string[];
};
export type ReportOpportunity = {
  number: number;
  title: string;
  text: string;
  source_question_ids: string[];
};
export type ReportAnswerItem = {
  question_id: string;
  code: string | null;
  label: string;
  answer: string | null;
  source: ResponseSource | null;
  scored: boolean;
  points: number | null;
  max_points: number | null;
  pillar_code: string | null;
};
export type ReportAnswerSection = {
  title: string;
  answers: ReportAnswerItem[];
  item_id?: string | null;
  item_name?: string | null;
  item_kind?: ItemKind | null;
};
export type ReportItem = {
  id: string;
  kind: ItemKind;
  kind_label: string;
  name: string;
  description: string | null;
  sections: ReportAnswerSection[];
  points: number;
  max_points: number;
};
export type MaturityReport = {
  diagnostic_id: string;
  versions: {
    diagnostic_version: string;
    methodology_version: string;
    report_version: string;
    maturity_scale_version: string | null;
  };
  generated_at: string;
  diagnostic: {
    id: string;
    status: string;
    started_at: string | null;
    completed_at: string | null;
    created_at: string;
  };
  company: CompanySnapshot;
  contact: ReportPerson;
  agent: ReportPerson;
  identification: {
    question_id: string;
    code: string | null;
    label: string;
    value: string | null;
    origin: ReportOrigin;
  }[];
  summary: {
    overall_score: number;
    overall_max: number;
    overall_percent: number | null;
    partial: boolean;
    maturity_level: {
      level: number;
      name: string;
      description: string;
      interpretation: string | null;
    } | null;
    maturity_scale_defined: boolean;
    headline: string;
    worst_case_score?: number | null;
    worst_case_percent?: number | null;
  };
  axes: ReportAxis[];
  pillars: ReportPillar[];
  indicators: ReportIndicator[];
  alerts: DiagnosticAlert[];
  strengths: ReportFinding[];
  attention_points: ReportFinding[];
  opportunities: ReportOpportunity[];
  analysis: {
    observed_data: string[];
    calculated_indicators: string[];
    interpretation: string[];
    opportunities: string[];
  };
  conclusions: string[];
  scope: {
    complete: boolean;
    evaluated_axes: string[];
    pending_axes: string[];
    text: string;
  };
  methodology: {
    objective: string;
    axes: { title: string; description: string | null }[];
    pillars: { title: string; description: string | null }[];
    scoring: string[];
    results: string[];
    maturity_scale: { title: string; description: string | null }[];
    maturity_scale_note: string | null;
  };
  answers: {
    step_id: string;
    title: string;
    status: "identification" | "evaluated" | "maintenance";
    sections: ReportAnswerSection[];
  }[];
  /** Produtos (1.1) e resíduos (1.7) com as avaliações individuais. */
  products?: ReportItem[];
  wastes?: ReportItem[];
};

const BASE = "/dmc/diagnostics";

export const diagnosticsService = {
  catalog() {
    return api.get<DiagnosticCatalog>(`${BASE}/catalog`, { auth: true });
  },
  companies() {
    return api.get<{ items: DiagnosticCompanyItem[]; total: number }>(`${BASE}/companies`, {
      auth: true,
    });
  },
  list(params: { company_id?: string; status?: DiagnosticStatus } = {}) {
    const search = new URLSearchParams();
    if (params.company_id) search.set("company_id", params.company_id);
    if (params.status) search.set("status", params.status);
    const qs = search.toString();
    return api.get<{ items: DiagnosticSummary[]; total: number }>(
      `${BASE}${qs ? `?${qs}` : ""}`,
      { auth: true },
    );
  },
  /** Inicia o diagnóstico — ou devolve o que já está em andamento. */
  start(companyId: string) {
    return api.post<DiagnosticDetail>(BASE, { company_id: companyId }, { auth: true });
  },
  get(id: string) {
    return api.get<DiagnosticDetail>(`${BASE}/${id}`, { auth: true });
  },
  saveResponses(id: string, body: { answers: AnswerInput[]; current_step?: string | null }) {
    return api.patch<DiagnosticDetail>(`${BASE}/${id}/responses`, body, { auth: true });
  },
  /** Cadastra produto/resíduo — gera suas perguntas nos eixos. */
  addItem(id: string, body: { kind: ItemKind; name: string; description?: string | null }) {
    return api.post<DiagnosticDetail>(`${BASE}/${id}/items`, body, { auth: true });
  },
  updateItem(id: string, itemId: string, body: { name?: string; description?: string | null }) {
    return api.patch<DiagnosticDetail>(`${BASE}/${id}/items/${itemId}`, body, { auth: true });
  },
  /** Exclui o item e todas as respostas vinculadas a ele. */
  deleteItem(id: string, itemId: string) {
    return api.delete<DiagnosticDetail>(`${BASE}/${id}/items/${itemId}`, { auth: true });
  },
  completeStep(id: string, stepId: string) {
    return api.post<DiagnosticDetail>(`${BASE}/${id}/steps/${stepId}/complete`, {}, { auth: true });
  },
  complete(id: string) {
    return api.post<DiagnosticDetail>(`${BASE}/${id}/complete`, {}, { auth: true });
  },
  /** Gera e persiste o relatório (reaproveita o já gerado). */
  generateReport(id: string) {
    return api.post<MaturityReport>(`${BASE}/${id}/report`, {}, { auth: true });
  },
  /** Relatório persistido (404 ``report_not_generated`` se ainda não gerado). */
  report(id: string) {
    return api.get<MaturityReport>(`${BASE}/${id}/report`, { auth: true });
  },
  /** PDF gerado no servidor a partir do relatório persistido. */
  reportPdf(id: string) {
    return api.getArrayBuffer(`${BASE}/${id}/report/pdf`, { auth: true });
  },
};
