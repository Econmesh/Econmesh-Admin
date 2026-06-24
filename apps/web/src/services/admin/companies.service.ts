import type {
  AdminCompanyCreatePayload,
  AdminCompanyListResponse,
  Company,
  CompanyUpdatePayload,
  LogoPresignResponse,
} from "@/types/api";
import { api } from "@/services/api/client";

function buildQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export const adminCompaniesService = {
  list(params: { page?: number; page_size?: number } = {}) {
    return api.get<AdminCompanyListResponse>(
      `/admin/companies${buildQuery(params)}`,
      { auth: true },
    );
  },

  get(id: string) {
    return api.get<Company>(`/admin/companies/${id}`, { auth: true });
  },

  create(body: AdminCompanyCreatePayload) {
    return api.post<Company>("/admin/companies", body, { auth: true });
  },

  update(id: string, body: CompanyUpdatePayload) {
    return api.patch<Company>(`/admin/companies/${id}`, body, { auth: true });
  },

  delete(id: string) {
    return api.delete<{ message: string }>(`/admin/companies/${id}`, { auth: true });
  },

  presignLogo(body: { filename: string; content_type: string }) {
    return api.post<LogoPresignResponse>("/companies/logo/presign", body, { auth: true });
  },
};
