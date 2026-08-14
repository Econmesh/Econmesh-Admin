"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@econmesh-admin/ui/components/card";
import { Skeleton } from "@econmesh-admin/ui/components/skeleton";
import {
  Building2,
  FileSignature,
  Handshake,
  Headphones,
  MessageCircle,
  ScrollText,
  Target,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import {
  ActivityLineCard,
  FunnelChartCard,
  NamedBarCard,
  StatusPieCard,
} from "@/modules/dashboard/components/dashboard-charts";
import { KpiCard } from "@/modules/dashboard/components/kpi-card";
import { formatCurrencyBRL } from "@/modules/dashboard/utils/format";
import { adminDashboardService } from "@/services/admin/dashboard.service";
import type { AdminDashboardResponse } from "@/types/dashboard";

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await adminDashboardService.get(30);
        if (!cancelled) setData(response);
      } catch {
        if (!cancelled) setError("Não foi possível carregar o dashboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Painel administrativo</h1>
        <p className="mt-1 text-muted-foreground">
          Olá, {user.name ?? user.email}. Visão geral da plataforma Econmesh.
        </p>
      </div>

      {error ? (
        <Card>
          <CardContent className="py-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      {loading || !data ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title="Usuários"
              value={data.totals.users}
              icon={Users}
              href="/dashboard/usuarios"
            />
            <KpiCard
              title="Empresas"
              value={data.totals.companies}
              icon={Building2}
              href="/dashboard/empresas"
            />
            <KpiCard
              title="Oportunidades ativas"
              value={data.totals.opportunities_active}
              icon={Target}
              href="/dashboard/oportunidades"
            />
            <KpiCard
              title="Conversas abertas"
              value={data.totals.conversations_open}
              icon={MessageCircle}
              href="/dashboard/conversas"
            />
            <KpiCard
              title="Minutas pendentes"
              value={data.totals.proposals_pending}
              icon={ScrollText}
              href="/dashboard/minutas"
              hint={`${data.totals.proposals} no total`}
            />
            <KpiCard
              title="Acordos em andamento"
              value={data.totals.agreements_pending}
              icon={Handshake}
              href="/dashboard/acordos"
              hint={`${data.totals.agreements_signed} assinados`}
            />
            <KpiCard
              title="Tickets abertos"
              value={data.totals.support_open}
              icon={Headphones}
              href="/dashboard/suporte"
            />
            <KpiCard
              title="Acordos assinados"
              value={data.totals.agreements_signed}
              icon={FileSignature}
              href="/dashboard/acordos"
            />
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Valor estimado no marketplace</CardTitle>
              <CardDescription>
                Soma de preço × quantidade nas oportunidades ativas com preço definido
                {" · "}
                {data.opportunities_with_price} com preço ·{" "}
                {data.opportunities_price_negotiable} negociáveis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tracking-tight">
                {formatCurrencyBRL(data.estimated_gmv)}
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <FunnelChartCard data={data.funnel} />
            <ActivityLineCard data={data.timeseries} days={data.days} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            <StatusPieCard
              title="Acordos por status"
              description="Distribuição do pipeline de assinaturas"
              data={data.agreements_by_status}
            />
            <StatusPieCard
              title="Minutas por status"
              description="Ciclo de aprovação das propostas"
              data={data.proposals_by_status}
            />
            <StatusPieCard
              title="Suporte"
              description="Tickets por situação"
              data={data.support_by_status}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <NamedBarCard
              title="Tipo de oportunidade"
              description="Comercialização, simbiose e compartilhamento"
              data={data.opportunities_by_type}
            />
            <NamedBarCard
              title="Oferta × demanda"
              description="Geradores e receptores ativos"
              data={data.opportunities_by_offer_demand}
            />
            <NamedBarCard
              title="Oportunidades por UF"
              description="Top 10 estados"
              data={data.opportunities_by_state}
            />
          </div>
        </>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full" />
        ))}
      </div>
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}
