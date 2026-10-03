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
  | "multi_choice";
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
};

export type DiagnosticSection = {
  id: string;
  step_id: string;
  title: string;
  description: string | null;
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

export type DiagnosticEvaluation = {
  steps: StepProgress[];
  progress: number;
  required_total: number;
  required_answered: number;
  pillars: PillarScore[];
  ems: EmsScore;
  complete: boolean;
  visible_question_ids: string[];
  alerts?: DiagnosticAlert[];
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
};

export type DiagnosticDetail = DiagnosticSummary & {
  catalog_version: string;
  company: CompanySnapshot;
  agent_name: string | null;
  responses: Record<string, DiagnosticResponse>;
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

export type ReportAnswer = {
  question_id: string;
  code: string | null;
  number: number | null;
  label: string;
  value: AnswerValue;
  display_value: string | null;
  source: ResponseSource | null;
  scored: boolean;
  points: number | null;
  max_points: number | null;
  pillar_id: string | null;
};

export type DiagnosticReport = {
  diagnostic: DiagnosticSummary;
  company: CompanySnapshot;
  agent_name: string | null;
  catalog_version: string;
  generated_at: string;
  steps: {
    id: string;
    title: string;
    availability: StepAvailability;
    sections: { id: string; title: string; answers: ReportAnswer[] }[];
  }[];
  pillars: (PillarScore & { code: string; name: string; ems_weight: number | null })[];
  ems: EmsScore;
  alerts: DiagnosticAlert[];
  maturity_level: string | null;
  observations: string[];
  recommendations: string[];
  executive_summary: string | null;
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
  completeStep(id: string, stepId: string) {
    return api.post<DiagnosticDetail>(`${BASE}/${id}/steps/${stepId}/complete`, {}, { auth: true });
  },
  complete(id: string) {
    return api.post<DiagnosticDetail>(`${BASE}/${id}/complete`, {}, { auth: true });
  },
  report(id: string) {
    return api.get<DiagnosticReport>(`${BASE}/${id}/report`, { auth: true });
  },
};
