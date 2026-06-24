import type {
  AdminUserCreatePayload,
  AdminUserListItem,
  AdminUserListParams,
  AdminUserListResponse,
  AdminUserUpdatePayload,
  MeUser,
  RegisterResponse,
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

export const adminUsersService = {
  list(params: AdminUserListParams = {}) {
    return api.get<AdminUserListResponse>(
      `/admin/users${buildQuery(params as Record<string, string | number | boolean | undefined>)}`,
      { auth: true },
    );
  },

  get(id: string) {
    return api.get<AdminUserListItem>(`/admin/users/${id}`, { auth: true });
  },

  create(body: AdminUserCreatePayload) {
    return api.post<RegisterResponse>("/admin/users", body, { auth: true });
  },

  update(id: string, body: AdminUserUpdatePayload) {
    return api.patch<MeUser>(`/admin/users/${id}`, body, { auth: true });
  },
};
