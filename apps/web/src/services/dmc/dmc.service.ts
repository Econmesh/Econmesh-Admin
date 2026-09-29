import { api } from "@/services/api/client";
import type { Opportunity, OpportunityListParams, OpportunityListResponse } from "@/types/api";

export type DmcIndicator = { key: string; label: string; value: number };

export type DmcTicket = {
  id: string;
  ticket_number: number;
  subject: string;
  status: "open" | "in_progress" | "closed";
  company: string | null;
  visitor_name: string | null;
  visitor_email: string | null;
  phone: string | null;
  position: string | null;
  user_id: string | null;
  company_id: string | null;
  assigned_agent_id: string | null;
  last_message_at: string | null;
  created_at: string;
};

export type DmcDashboard = {
  indicators: DmcIndicator[];
  recent_tickets: DmcTicket[];
};

export type DmcCompany = {
  id: string;
  legal_name: string;
  trade_name: string | null;
  tax_id: string;
  city: string | null;
  state: string | null;
  sector: string | null;
  in_portfolio: boolean;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  description?: string | null;
  legal_representative?: string | null;
  source?: "registered" | "assigned" | null;
  owner_user_id?: string | null;
  owner_name?: string | null;
};

export type DmcCompanyUser = {
  id: string;
  name: string | null;
  email: string | null;
  job_title: string | null;
  company_id: string;
};

export type DmcConversation = {
  id: string;
  agent_user_id: string;
  user_id: string;
  user_name: string | null;
  company_id: string;
  company_name: string | null;
  last_message_at: string | null;
  last_author_role: "dmc_agent" | "user" | null;
  last_message_preview: string | null;
  created_at: string;
};

export type DmcMessage = {
  id: string;
  conversation_id: string;
  author_id: string;
  author_role: "dmc_agent" | "user";
  author_name: string | null;
  body: string;
  created_at: string;
};

export type DmcSupportMessage = {
  id: string;
  ticket_id: string;
  author_id: string;
  author_role: string;
  author_name: string | null;
  message_type: string;
  body: string;
  created_at: string;
};

export type DmcNotificationBatch = {
  id: string;
  title: string;
  body: string;
  recipient_user_ids: string[];
  created_at: string;
};

export type DmcQueueAgent = {
  user_id: string;
  name: string | null;
  email: string | null;
  is_active: boolean;
  available: boolean;
  queue_position: number;
  open_count: number;
  in_progress_count: number;
  last_assigned_at: string | null;
};

export type DmcQueue = {
  mode: "manual" | "round_robin";
  next_agent_user_id: string | null;
  agents: DmcQueueAgent[];
};

export type DmcAgentDetail = {
  user_id: string;
  name: string | null;
  email: string | null;
  is_active: boolean;
  available: boolean;
  queue_position: number;
  companies: DmcCompany[];
  open_count: number;
  in_progress_count: number;
  last_assigned_at: string | null;
};

export type AuditEvent = {
  id: string;
  actor_user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  created_at: string;
};

function opportunityQuery(params: OpportunityListParams = {}) {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.page_size) search.set("page_size", String(params.page_size));
  if (params.q) search.set("q", params.q);
  if (params.opportunity_type) search.set("opportunity_type", params.opportunity_type);
  if (params.offer_demand) search.set("offer_demand", params.offer_demand);
  if (params.category) search.set("category", params.category);
  if (params.state) search.set("state", params.state);
  if (params.city) search.set("city", params.city);
  if (params.periodicity) search.set("periodicity", params.periodicity);
  if (params.sort) search.set("sort", params.sort);
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export const dmcAgentService = {
  dashboard() {
    return api.get<DmcDashboard>("/dmc/dashboard", { auth: true });
  },
  companies() {
    return api.get<{ items: DmcCompany[]; total: number }>("/dmc/companies", { auth: true });
  },
  searchCompanies(q: string) {
    return api.get<{ items: DmcCompany[]; total: number }>(
      `/dmc/companies/search?q=${encodeURIComponent(q)}`,
      { auth: true },
    );
  },
  company(id: string) {
    return api.get<DmcCompany>(`/dmc/companies/${id}`, { auth: true });
  },
  companyUsers(id: string) {
    return api.get<DmcCompanyUser[]>(`/dmc/companies/${id}/users`, { auth: true });
  },
  opportunities(params?: OpportunityListParams) {
    return api.get<OpportunityListResponse>(`/dmc/opportunities${opportunityQuery(params)}`, {
      auth: true,
    });
  },
  opportunity(id: string) {
    return api.get<Opportunity>(`/dmc/opportunities/${id}`, { auth: true });
  },
  conversations() {
    return api.get<{ items: DmcConversation[]; total: number }>("/dmc/conversations", {
      auth: true,
    });
  },
  openConversation(userId: string, body: string) {
    return api.post<DmcConversation>("/dmc/conversations", { user_id: userId, body }, { auth: true });
  },
  messages(conversationId: string) {
    return api.get<{ items: DmcMessage[]; total: number }>(
      `/dmc/conversations/${conversationId}/messages`,
      { auth: true },
    );
  },
  sendMessage(conversationId: string, body: string) {
    return api.post<DmcMessage>(
      `/dmc/conversations/${conversationId}/messages`,
      { body },
      { auth: true },
    );
  },
  sendNotification(title: string, body: string, userIds: string[]) {
    return api.post<DmcNotificationBatch>(
      "/dmc/notifications",
      { title, body, user_ids: userIds },
      { auth: true },
    );
  },
  sentNotifications() {
    return api.get<{ items: DmcNotificationBatch[]; total: number }>("/dmc/notifications/sent", {
      auth: true,
    });
  },
  tickets(status?: string) {
    const qs = status ? `?status=${status}` : "";
    return api.get<{ items: DmcTicket[]; total: number }>(`/dmc/support/tickets${qs}`, {
      auth: true,
    });
  },
  ticket(id: string) {
    return api.get<DmcTicket>(`/dmc/support/tickets/${id}`, { auth: true });
  },
  ticketMessages(id: string) {
    return api.get<DmcSupportMessage[]>(`/dmc/support/tickets/${id}/messages`, { auth: true });
  },
  replyTicket(id: string, body: string) {
    return api.post<DmcSupportMessage>(
      `/dmc/support/tickets/${id}/messages`,
      { body },
      { auth: true },
    );
  },
  closeTicket(id: string) {
    return api.post<DmcTicket>(`/dmc/support/tickets/${id}/close`, {}, { auth: true });
  },
};

export const dmcAdminService = {
  queue() {
    return api.get<DmcQueue>("/admin/dmc/queue", { auth: true });
  },
  setMode(mode: "manual" | "round_robin") {
    return api.patch<DmcQueue>("/admin/dmc/settings", { mode }, { auth: true });
  },
  reorder(agentUserIds: string[]) {
    return api.put<DmcQueue>("/admin/dmc/queue", { agent_user_ids: agentUserIds }, { auth: true });
  },
  agent(userId: string) {
    return api.get<DmcAgentDetail>(`/admin/dmc/agents/${userId}`, { auth: true });
  },
  setAvailability(userId: string, available: boolean) {
    return api.patch<DmcQueueAgent>(
      `/admin/dmc/agents/${userId}/availability`,
      { available },
      { auth: true },
    );
  },
  linkCompany(userId: string, companyId: string, source: "registered" | "assigned") {
    return api.post<DmcCompany>(
      `/admin/dmc/agents/${userId}/companies`,
      { company_id: companyId, source },
      { auth: true },
    );
  },
  unlinkCompany(userId: string, companyId: string) {
    return api.delete<{ message: string }>(
      `/admin/dmc/agents/${userId}/companies/${companyId}`,
      { auth: true },
    );
  },
  agentTickets(userId: string) {
    return api.get<{ items: DmcTicket[]; total: number }>(
      `/admin/dmc/agents/${userId}/tickets`,
      { auth: true },
    );
  },
  assignTicket(ticketId: string, agentUserId: string) {
    return api.post<{ items: DmcTicket[]; total: number }>(
      `/admin/dmc/tickets/${ticketId}/assign`,
      { agent_user_id: agentUserId },
      { auth: true },
    );
  },
  audit() {
    return api.get<{ items: AuditEvent[]; total: number }>("/admin/dmc/audit", { auth: true });
  },
};
