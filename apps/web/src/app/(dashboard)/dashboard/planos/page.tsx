"use client";

import { Badge } from "@econmesh-admin/ui/components/badge";
import { Button } from "@econmesh-admin/ui/components/button";
import { Skeleton } from "@econmesh-admin/ui/components/skeleton";
import { Plus } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { formatMoneyBRL } from "@/modules/billing/schemas";
import { adminBillingService } from "@/services/admin/billing.service";
import type { BillingPlan } from "@/types/api";
import { ApiError } from "@/utils/errors";

export default function PlanosPage() {
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminBillingService.listPlans();
      setPlans(data.items);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Não foi possível carregar os planos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Planos</h1>
          <p className="text-sm text-muted-foreground">Crie e edite os valores dos planos.</p>
        </div>
        <Link href={"/dashboard/planos/novo" as Route}>
          <Button>
            <Plus className="size-4" />
            Novo plano
          </Button>
        </Link>
      </div>
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {plans.map((plan) => (
            <Link
              key={plan.id}
              href={`/dashboard/planos/${plan.id}/editar` as Route}
              className="rounded-xl border p-4 transition-colors hover:border-primary"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold">{plan.name}</h2>
                <Badge variant={plan.is_active ? "success" : "secondary"}>
                  {plan.is_active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <p className="mt-2 text-lg font-bold">
                {formatMoneyBRL(plan.price)}
                <span className="text-sm font-normal text-muted-foreground">
                  /{plan.cycle === "YEARLY" ? "ano" : "mês"}
                </span>
              </p>
              {plan.description ? (
                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
              ) : null}
            </Link>
          ))}
          {plans.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum plano cadastrado.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
