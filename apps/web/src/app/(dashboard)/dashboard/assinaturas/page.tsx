"use client";

import { Badge } from "@econmesh-admin/ui/components/badge";
import { Button } from "@econmesh-admin/ui/components/button";
import { Skeleton } from "@econmesh-admin/ui/components/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@econmesh-admin/ui/components/tabs";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { GrantAccessDialog } from "@/modules/billing/components/grant-access-dialog";
import { formatMoneyBRL } from "@/modules/billing/schemas";
import { adminBillingService } from "@/services/admin/billing.service";
import type {
  AdminAccessGrant,
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
  const [grants, setGrants] = useState<AdminAccessGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [grantOpen, setGrantOpen] = useState(false);
  const [grantTarget, setGrantTarget] = useState<AdminPendingUserItem | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [open, canceled, pendingUsers, accessGrants] = await Promise.all([
        adminBillingService.listSubscriptions(),
        adminBillingService.listSubscriptions({ status: "cancelled" }),
        adminBillingService.listPendingUsers(),
        adminBillingService.listAccessGrants(),
      ]);
      setActive(open.items.filter((item) => item.status !== "cancelled"));
      setCancelled(canceled.items);
      setPending(pendingUsers.items);
      setGrants(accessGrants.items);
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

  async function handleRevoke(grantId: string) {
    if (!window.confirm("Revogar este acesso excepcional?")) return;
    setRevokingId(grantId);
    try {
      await adminBillingService.revokeAccessGrant(grantId);
      toast.success("Acesso excepcional revogado.");
      await load();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Não foi possível revogar o acesso.",
      );
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Assinaturas</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe assinaturas ativas, canceladas, usuários pendentes e acessos excepcionais.
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
            <TabsTrigger value="excepcionais">Excepcionais ({grants.length})</TabsTrigger>
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
              <div
                key={`${item.user_id}-${item.company_id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
              >
                <div>
                  <p className="font-medium">{item.user_name || item.user_email || item.user_id}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.company_name || "Sem empresa"}
                    {item.user_email ? ` · ${item.user_email}` : ""}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setGrantTarget(item);
                    setGrantOpen(true);
                  }}
                >
                  Liberar acesso
                </Button>
              </div>
            ))}
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum usuário pendente.</p>
            ) : null}
          </TabsContent>
          <TabsContent value="excepcionais" className="mt-4 space-y-3">
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => {
                  setGrantTarget(null);
                  setGrantOpen(true);
                }}
              >
                Liberar acesso
              </Button>
            </div>
            {grants.map((grant) => (
              <div
                key={grant.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
              >
                <div>
                  <p className="font-medium">
                    {grant.user_name || grant.user_email || grant.user_id}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {grant.company_name || "Empresa"}
                    {" · até "}
                    {new Date(grant.expires_at).toLocaleString("pt-BR")}
                    {grant.reason ? ` · ${grant.reason}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={grant.is_active ? "success" : "secondary"}>
                    {grant.is_active ? "Ativo" : grant.revoked_at ? "Revogado" : "Expirado"}
                  </Badge>
                  {grant.is_active ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={revokingId === grant.id}
                      onClick={() => void handleRevoke(grant.id)}
                    >
                      Revogar
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
            {grants.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum acesso excepcional.</p>
            ) : null}
          </TabsContent>
        </Tabs>
      )}

      {grantOpen ? (
        <GrantAccessDialog
          userId={grantTarget?.user_id}
          companyId={grantTarget?.company_id ?? undefined}
          userLabel={
            grantTarget
              ? grantTarget.user_name || grantTarget.user_email || grantTarget.user_id
              : undefined
          }
          onClose={() => {
            setGrantOpen(false);
            setGrantTarget(null);
          }}
          onGranted={() => void load()}
        />
      ) : null}
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
