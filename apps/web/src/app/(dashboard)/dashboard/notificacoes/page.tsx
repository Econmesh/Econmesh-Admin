"use client";

import { Button } from "@econmesh-admin/ui/components/button";
import { Skeleton } from "@econmesh-admin/ui/components/skeleton";
import { Plus, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { NotificationCampaignList } from "@/modules/notifications/components/notification-campaign-list";
import type { CampaignTargetLookups } from "@/modules/notifications/utils";
import {
  adminNotificationGroupsService,
  adminNotificationsService,
} from "@/services/admin/notifications.service";
import { adminUsersService } from "@/services/admin/users.service";
import type { NotificationCampaign } from "@/types/api";
import { ApiError } from "@/utils/errors";

const EMPTY_LOOKUPS: CampaignTargetLookups = {
  usersById: {},
  groupsById: {},
};

export default function NotificacoesPage() {
  const [campaigns, setCampaigns] = useState<NotificationCampaign[]>([]);
  const [lookups, setLookups] = useState<CampaignTargetLookups>(EMPTY_LOOKUPS);
  const [loading, setLoading] = useState(true);

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const [campaignsData, usersData, groupsData] = await Promise.all([
        adminNotificationsService.list({ page_size: 50 }),
        adminUsersService.list({ page_size: 200 }),
        adminNotificationGroupsService.list({ page_size: 100 }),
      ]);
      setCampaigns(campaignsData.items);
      setLookups({
        usersById: Object.fromEntries(
          usersData.items.map((user) => [
            user.id,
            user.name ?? user.email ?? user.id,
          ]),
        ),
        groupsById: Object.fromEntries(
          groupsData.items.map((group) => [group.id, group.name]),
        ),
      });
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Não foi possível carregar as notificações.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCampaigns();
  }, [loadCampaigns]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Notificações</h1>
          <p className="text-sm text-muted-foreground">
            Envio e gestão de notificações da plataforma.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/notificacoes/grupos" className="inline-flex">
            <Button variant="outline">
              <Users className="size-4" aria-hidden />
              Grupos
            </Button>
          </Link>
          <Link href="/dashboard/notificacoes/nova" className="inline-flex">
            <Button>
              <Plus className="size-4" aria-hidden />
              Nova notificação
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : (
        <NotificationCampaignList campaigns={campaigns} lookups={lookups} />
      )}
    </div>
  );
}
