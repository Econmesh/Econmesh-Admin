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
import { CampaignChannels } from "@/modules/notifications/components/campaign-channels";
import { CAMPAIGN_STATUS_LABELS } from "@/modules/notifications/schemas";
import {
  formatCampaignTarget,
  type CampaignTargetLookups,
} from "@/modules/notifications/utils";
import type { NotificationCampaign } from "@/types/api";

type NotificationCampaignListProps = {
  campaigns: NotificationCampaign[];
  lookups: CampaignTargetLookups;
};

function statusVariant(
  status: NotificationCampaign["status"],
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "sent") return "default";
  if (status === "failed") return "destructive";
  if (status === "scheduled") return "outline";
  return "secondary";
}

export function NotificationCampaignList({
  campaigns,
  lookups,
}: NotificationCampaignListProps) {
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
      {campaigns.map((campaign) => {
        const targetLabel = formatCampaignTarget(campaign, lookups);

        return (
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
          <CardContent className="flex flex-wrap items-center justify-between gap-4">
            <dl className="grid min-w-0 w-full flex-1 grid-cols-3 gap-x-8 text-sm sm:max-w-2xl">
              <div className="min-w-0">
                <dt className="text-xs text-muted-foreground">Destino</dt>
                <dd className="truncate" title={targetLabel}>
                  {targetLabel}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs text-muted-foreground">Canais</dt>
                <dd>
                  <CampaignChannels channels={campaign.channels} />
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs text-muted-foreground">Entregues</dt>
                <dd>
                  {campaign.stats.delivered}/{campaign.stats.total}
                </dd>
              </div>
            </dl>
            <Link href={`/dashboard/notificacoes/${campaign.id}`} className="inline-flex shrink-0">
              <Button size="sm" variant="outline">
                <Eye className="size-4" aria-hidden />
                Detalhes
              </Button>
            </Link>
          </CardContent>
        </Card>
        );
      })}
    </div>
  );
}
