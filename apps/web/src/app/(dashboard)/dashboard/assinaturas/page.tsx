"use client";

import { Badge } from "@econmesh-admin/ui/components/badge";
import { Skeleton } from "@econmesh-admin/ui/components/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@econmesh-admin/ui/components/tabs";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { formatMoneyBRL } from "@/modules/billing/schemas";
import { adminBillingService } from "@/services/admin/billing.service";
import type {
  AdminPendingUserItem,
  AdminSubscriptionListItem,
} from "@/types/api";
import { ApiError } from "@/utils/errors";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  trialing: "Trial",
  active: "Ativa",
  past_due: "Em atraso",
  cancelled: "Cancelada",
  expired: "Expirada",
};

export default function AssinaturasPage() {
  const [active, setActive] = useState<AdminSubscriptionListItem[]>([]);
  const [cancelled, setCancelled] = useState<AdminSubscriptionListItem[]>([]);
  const [pending, setPending] = useState<AdminPendingUserItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [open, canceled, pendingUsers] = await Promise.all([
        adminBillingService.listSubscriptions(),
        adminBillingService.listSubscriptions({ status: "cancelled" }),
        adminBillingService.listPendingUsers(),
      ]);
      setActive(open.items.filter((item) => item.status !== "cancelled"));
      setCancelled(canceled.items);
      setPending(pendingUsers.items);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Não foi possível carregar as assinaturas.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Assinaturas</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe assinaturas ativas, canceladas e usuários pendentes.
        </p>
      </div>
      {loading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : (
        <Tabs defaultValue="ativas">
          <TabsList>
            <TabsTrigger value="ativas">Ativas ({active.length})</TabsTrigger>
            <TabsTrigger value="canceladas">Canceladas ({cancelled.length})</TabsTrigger>
            <TabsTrigger value="pendentes">Pendentes ({pending.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="ativas" className="mt-4 space-y-2">
            {active.map((item) => (
              <SubscriptionRow key={item.id} item={item} />
            ))}
            {active.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma assinatura ativa.</p>
            ) : null}
          </TabsContent>
          <TabsContent value="canceladas" className="mt-4 space-y-2">
            {cancelled.map((item) => (
              <SubscriptionRow key={item.id} item={item} />
            ))}
            {cancelled.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma assinatura cancelada.</p>
            ) : null}
          </TabsContent>
          <TabsContent value="pendentes" className="mt-4 space-y-2">
            {pending.map((item) => (
              <div key={`${item.user_id}-${item.company_id}`} className="rounded-xl border p-4">
                <p className="font-medium">{item.user_name || item.user_email || item.user_id}</p>
                <p className="text-sm text-muted-foreground">
                  {item.company_name || "Sem empresa"}
                  {item.user_email ? ` · ${item.user_email}` : ""}
                </p>
              </div>
            ))}
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum usuário pendente.</p>
            ) : null}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function SubscriptionRow({ item }: { item: AdminSubscriptionListItem }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
      <div>
        <p className="font-medium">{item.company_name || item.user_name || item.id}</p>
        <p className="text-sm text-muted-foreground">
          {item.plan_name || "Plano"} · {formatMoneyBRL(item.price)} · {item.user_email}
        </p>
      </div>
      <Badge variant={item.status === "active" || item.status === "trialing" ? "success" : "secondary"}>
        {STATUS_LABEL[item.status] ?? item.status}
      </Badge>
    </div>
  );
}
