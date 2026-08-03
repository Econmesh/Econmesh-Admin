import type { Route } from "next";

import type { NotificationCampaign, UserNotification } from "@/types/api";

export function getNotificationHref(notification: UserNotification): Route | null {
  if (notification.kind === "support") {
    const ticketId = notification.metadata?.ticket_id;
    return ticketId ? (`/dashboard/suporte/${ticketId}` as Route) : "/dashboard/suporte";
  }
  if (notification.kind === "agreement") {
    return "/dashboard/acordos";
  }
  return null;
}

function truncateId(id: string): string {
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

function resolveLabels(ids: string[], labelsById: Record<string, string>): string {
  return ids.map((id) => labelsById[id] ?? truncateId(id)).join(", ");
}

export type CampaignTargetLookups = {
  usersById: Record<string, string>;
  groupsById: Record<string, string>;
};

export function formatCampaignTarget(
  campaign: Pick<
    NotificationCampaign,
    "target_type" | "target_user_ids" | "target_group_ids"
  >,
  lookups: CampaignTargetLookups,
): string {
  if (campaign.target_type === "all") {
    return "Todos";
  }
  if (campaign.target_type === "groups") {
    const names = resolveLabels(campaign.target_group_ids, lookups.groupsById);
    return names ? `Grupos: ${names}` : "Grupos";
  }
  const names = resolveLabels(campaign.target_user_ids, lookups.usersById);
  return names ? `Usuários: ${names}` : "Usuários";
}
