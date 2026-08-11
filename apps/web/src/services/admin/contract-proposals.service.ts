import { api } from "@/services/api/client";
import type {
  ContractProposal,
  ContractProposalListResponse,
} from "@/types/api";

function buildQuery(params: {
  page?: number;
  page_size?: number;
  conversation_id?: string;
}): string {
  const search = new URLSearchParams();
  search.set("page", String(params.page ?? 1));
  search.set("page_size", String(params.page_size ?? 50));
  if (params.conversation_id) {
    search.set("conversation_id", params.conversation_id);
  }
  return search.toString();
}

export const adminContractProposalsService = {
  list(params?: {
    page?: number;
    page_size?: number;
    conversation_id?: string;
  }) {
    const query = buildQuery(params ?? {});
    return api.get<ContractProposalListResponse>(
      `/admin/contract-proposals?${query}`,
      { auth: true },
    );
  },

  get(id: string) {
    return api.get<ContractProposal>(`/admin/contract-proposals/${id}`, {
      auth: true,
    });
  },
};
