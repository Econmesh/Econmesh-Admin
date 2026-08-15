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
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { GrantAccessForm } from "@/modules/billing/components/grant-access-form";
import { adminBillingService } from "@/services/admin/billing.service";
import type { AdminAccessGrant } from "@/types/api";
import { ApiError } from "@/utils/errors";

type UserAccessGrantCardProps = {
  userId: string;
};

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("pt-BR");
}

export function UserAccessGrantCard({ userId }: UserAccessGrantCardProps) {
  const [grant, setGrant] = useState<AdminAccessGrant | null>(null);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminBillingService.listAccessGrants({
        userId,
        activeOnly: true,
      });
      setGrant(response.items[0] ?? null);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Não foi possível carregar o acesso excepcional.",
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRevoke() {
    if (!grant) return;
    if (!window.confirm("Revogar o acesso excepcional deste usuário?")) return;
    setRevoking(true);
    try {
      await adminBillingService.revokeAccessGrant(grant.id);
      toast.success("Acesso excepcional revogado.");
      await load();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Não foi possível revogar o acesso.",
      );
    } finally {
      setRevoking(false);
    }
  }

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle>Acesso excepcional</CardTitle>
        <CardDescription>
          Liberação temporária sem cobrança, com prazo definido.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <>
            {grant ? (
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="success">Ativo</Badge>
                  <p className="text-sm">
                    Até{" "}
                    <span className="font-medium">{formatDateTime(grant.expires_at)}</span>
                  </p>
                </div>
                {grant.reason ? (
                  <p className="text-sm text-muted-foreground">{grant.reason}</p>
                ) : null}
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => void handleRevoke()}
                  disabled={revoking}
                >
                  {revoking ? "Revogando…" : "Revogar acesso"}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum acesso excepcional vigente.
              </p>
            )}
            <GrantAccessForm
              userId={userId}
              submitLabel={grant ? "Atualizar prazo" : "Liberar acesso"}
              onGranted={() => void load()}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
