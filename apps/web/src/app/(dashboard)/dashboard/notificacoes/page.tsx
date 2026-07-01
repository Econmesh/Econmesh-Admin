"use client";

import { Button } from "@econmesh-admin/ui/components/button";
import { Skeleton } from "@econmesh-admin/ui/components/skeleton";
import { Plus, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { NotificationCampaignList } from "@/modules/notifications/components/notification-campaign-list";
import { adminNotificationsService } from "@/services/admin/notifications.service";
import type { NotificationCampaign } from "@/types/api";
import { ApiError } from "@/utils/errors";

export default function NotificacoesPage() {
  const [campaigns, setCampaigns] = useState<NotificationCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminNotificationsService.list({ page_size: 50 });
      setCampaigns(data.items);
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
        <NotificationCampaignList campaigns={campaigns} />
      )}
    </div>
  );
}
