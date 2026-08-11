import type {
  ContractSection,
  ContractSectionCreatePayload,
  ContractSectionListResponse,
  ContractSectionUpdatePayload,
  MinutaStructureResponse,
  SectionAppliesTo,
} from "@/types/api";
import { api } from "@/services/api/client";

function buildQuery(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export const adminContractSectionsService = {
  list(
    params: {
      page?: number;
      page_size?: number;
      contract_type?: SectionAppliesTo;
      active_only?: boolean;
    } = {},
  ) {
    return api.get<ContractSectionListResponse>(
      `/admin/contract-sections${buildQuery(params)}`,
      { auth: true },
    );
  },

  structure(params: { contract_type?: SectionAppliesTo } = {}) {
    return api.get<MinutaStructureResponse>(
      `/admin/contract-sections/structure${buildQuery(params)}`,
      { auth: true },
    );
  },

  reorder(orderedIds: string[]) {
    return api.put<ContractSectionListResponse>(
      "/admin/contract-sections/reorder",
      { ordered_ids: orderedIds },
      { auth: true },
    );
  },

  get(id: string) {
    return api.get<ContractSection>(`/admin/contract-sections/${id}`, { auth: true });
  },

  create(body: ContractSectionCreatePayload) {
    return api.post<ContractSection>("/admin/contract-sections", body, { auth: true });
  },

  update(id: string, body: ContractSectionUpdatePayload) {
    return api.patch<ContractSection>(`/admin/contract-sections/${id}`, body, {
      auth: true,
    });
  },

  delete(id: string) {
    return api.delete<{ message: string }>(`/admin/contract-sections/${id}`, {
      auth: true,
    });
  },
};
