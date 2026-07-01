"use client";

import { Badge } from "@econmesh-admin/ui/components/badge";
import { Button } from "@econmesh-admin/ui/components/button";
import { Skeleton } from "@econmesh-admin/ui/components/skeleton";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { CAMPAIGN_STATUS_LABELS } from "@/modules/notifications/schemas";
import { adminNotificationsService } from "@/services/admin/notifications.service";
import type { NotificationCampaign } from "@/types/api";
import { ApiError } from "@/utils/errors";

export default function NotificacaoDetalhePage() {
  const params = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<NotificationCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadCampaign = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminNotificationsService.get(params.id);
      setCampaign(data);
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
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Destino</dt>
            <dd className="capitalize">{campaign.target_type}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Canais</dt>
            <dd>{campaign.channels.join(", ")}</dd>
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
