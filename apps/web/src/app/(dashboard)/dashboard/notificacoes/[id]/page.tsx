"use client";

import { Badge } from "@econmesh-admin/ui/components/badge";
import { Button } from "@econmesh-admin/ui/components/button";
import { Skeleton } from "@econmesh-admin/ui/components/skeleton";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { CampaignChannels } from "@/modules/notifications/components/campaign-channels";
import { CAMPAIGN_STATUS_LABELS } from "@/modules/notifications/schemas";
import {
  formatCampaignTarget,
  type CampaignTargetLookups,
} from "@/modules/notifications/utils";
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

export default function NotificacaoDetalhePage() {
  const params = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<NotificationCampaign | null>(null);
  const [lookups, setLookups] = useState<CampaignTargetLookups>(EMPTY_LOOKUPS);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadCampaign = useCallback(async () => {
    setLoading(true);
    try {
      const [data, usersData, groupsData] = await Promise.all([
        adminNotificationsService.get(params.id),
        adminUsersService.list({ page_size: 200 }),
        adminNotificationGroupsService.list({ page_size: 100 }),
      ]);
      setCampaign(data);
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
        error instanceof ApiError ? error.message : "Não foi possível carregar a notificação.",
      );
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void loadCampaign();
  }, [loadCampaign]);

  async function handleCancel() {
    if (!campaign) return;
    setActionLoading(true);
    try {
      const updated = await adminNotificationsService.cancel(campaign.id);
      setCampaign(updated);
      toast.success("Campanha cancelada.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Não foi possível cancelar.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSendNow() {
    if (!campaign) return;
    setActionLoading(true);
    try {
      const updated = await adminNotificationsService.sendNow(campaign.id);
      setCampaign(updated);
      toast.success("Campanha enviada.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Não foi possível enviar.");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return <Skeleton className="h-64 rounded-xl" />;
  }

  if (!campaign) {
    return <p className="text-sm text-muted-foreground">Notificação não encontrada.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard/notificacoes" className="hover:underline">
            Notificações
          </Link>
          {" / "}Detalhes
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{campaign.title}</h1>
          <Badge>{CAMPAIGN_STATUS_LABELS[campaign.status] ?? campaign.status}</Badge>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-border p-6">
        <p className="whitespace-pre-wrap text-sm">{campaign.body}</p>
        <dl className="grid gap-10 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Destino</dt>
            <dd className="break-words">{formatCampaignTarget(campaign, lookups)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Canais</dt>
            <dd>
              <CampaignChannels channels={campaign.channels} />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Agendamento</dt>
            <dd>
              {campaign.send_at
                ? new Date(campaign.send_at).toLocaleString("pt-BR")
                : "Envio imediato"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Enviada em</dt>
            <dd>
              {campaign.sent_at
                ? new Date(campaign.sent_at).toLocaleString("pt-BR")
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Entregues</dt>
            <dd>
              {campaign.stats.delivered} de {campaign.stats.total}
              {campaign.stats.failed > 0 ? ` (${campaign.stats.failed} falhas)` : ""}
            </dd>
          </div>
        </dl>
        {campaign.error_message ? (
          <p className="text-sm text-destructive">{campaign.error_message}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {campaign.status === "scheduled" ? (
          <>
            <Button onClick={handleSendNow} disabled={actionLoading}>
              Enviar agora
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={actionLoading}>
              Cancelar agendamento
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}
