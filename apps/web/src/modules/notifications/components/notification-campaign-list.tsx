"use client";

import { Badge } from "@econmesh-admin/ui/components/badge";
import { Button } from "@econmesh-admin/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@econmesh-admin/ui/components/card";
import { Bell, Eye } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/feedback/empty-state";
import { CAMPAIGN_STATUS_LABELS } from "@/modules/notifications/schemas";
import type { NotificationCampaign } from "@/types/api";

type NotificationCampaignListProps = {
  campaigns: NotificationCampaign[];
};

function statusVariant(
  status: NotificationCampaign["status"],
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "sent") return "default";
  if (status === "failed") return "destructive";
  if (status === "scheduled") return "outline";
  return "secondary";
}

export function NotificationCampaignList({ campaigns }: NotificationCampaignListProps) {
  if (campaigns.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="Nenhuma notificação enviada"
        description="Crie a primeira campanha de notificação."
        action={
          <Link href="/dashboard/notificacoes/nova" className="inline-flex">
            <Button>Nova notificação</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-4">
      {campaigns.map((campaign) => (
        <Card key={campaign.id} className="rounded-xl">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <CardTitle className="text-base">{campaign.title}</CardTitle>
                <CardDescription className="line-clamp-2">{campaign.body}</CardDescription>
              </div>
              <Badge variant={statusVariant(campaign.status)}>
                {CAMPAIGN_STATUS_LABELS[campaign.status] ?? campaign.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <dl className="grid gap-1 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-muted-foreground">Destino</dt>
                <dd className="capitalize">{campaign.target_type}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Canais</dt>
                <dd>{campaign.channels.join(", ")}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Entregues</dt>
                <dd>
                  {campaign.stats.delivered}/{campaign.stats.total}
                </dd>
              </div>
            </dl>
            <Link href={`/dashboard/notificacoes/${campaign.id}`} className="inline-flex">
              <Button size="sm" variant="outline">
                <Eye className="size-4" aria-hidden />
                Detalhes
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
