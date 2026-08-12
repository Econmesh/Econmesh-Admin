import type { AdminDashboardResponse } from "@/types/dashboard";
import { api } from "@/services/api/client";

export const adminDashboardService = {
  get(days = 30) {
    return api.get<AdminDashboardResponse>(`/admin/dashboard?days=${days}`, {
      auth: true,
    });
  },
};
