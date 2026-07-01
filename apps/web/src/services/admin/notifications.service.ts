import type {
  NotificationCampaign,
  NotificationCampaignCreatePayload,
  NotificationCampaignListResponse,
  NotificationGroup,
  NotificationGroupCreatePayload,
  NotificationGroupListResponse,
  NotificationGroupUpdatePayload,
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

export const adminNotificationGroupsService = {
  list(params: { page?: number; page_size?: number } = {}) {
    return api.get<NotificationGroupListResponse>(
      `/admin/notification-groups${buildQuery(params)}`,
      { auth: true },
    );
  },

  get(id: string) {
    return api.get<NotificationGroup>(`/admin/notification-groups/${id}`, { auth: true });
  },

  create(body: NotificationGroupCreatePayload) {
    return api.post<NotificationGroup>("/admin/notification-groups", body, { auth: true });
  },

  update(id: string, body: NotificationGroupUpdatePayload) {
    return api.patch<NotificationGroup>(`/admin/notification-groups/${id}`, body, {
      auth: true,
    });
  },

  delete(id: string) {
    return api.delete<{ message: string }>(`/admin/notification-groups/${id}`, { auth: true });
  },
};

export const adminNotificationsService = {
  list(params: { page?: number; page_size?: number } = {}) {
    return api.get<NotificationCampaignListResponse>(
      `/admin/notifications${buildQuery(params)}`,
      { auth: true },
    );
  },

  get(id: string) {
    return api.get<NotificationCampaign>(`/admin/notifications/${id}`, { auth: true });
  },

  create(body: NotificationCampaignCreatePayload) {
    return api.post<NotificationCampaign>("/admin/notifications", body, { auth: true });
  },

  cancel(id: string) {
    return api.post<NotificationCampaign>(`/admin/notifications/${id}/cancel`, undefined, {
      auth: true,
    });
  },

  sendNow(id: string) {
    return api.post<NotificationCampaign>(`/admin/notifications/${id}/send-now`, undefined, {
      auth: true,
    });
  },
};
