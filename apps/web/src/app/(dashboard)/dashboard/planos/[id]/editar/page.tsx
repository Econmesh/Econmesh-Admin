"use client";

import { Skeleton } from "@econmesh-admin/ui/components/skeleton";
import type { Route } from "next";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PlanForm } from "@/modules/billing/components/plan-form";
import { adminBillingService } from "@/services/admin/billing.service";
import type { BillingPlan } from "@/types/api";
import { ApiError } from "@/utils/errors";

export default function EditarPlanoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [plan, setPlan] = useState<BillingPlan | null>(null);

  useEffect(() => {
    void adminBillingService
      .getPlan(params.id)
      .then(setPlan)
      .catch((error) => {
        toast.error(error instanceof ApiError ? error.message : "Plano não encontrado.");
        router.push("/dashboard/planos" as Route);
      });
  }, [params.id, router]);

  if (!plan) {
    return <Skeleton className="h-64 rounded-xl" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href={"/dashboard/planos" as Route} className="hover:underline">
            Planos
          </Link>
          {" / "}Editar
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Editar plano</h1>
      </div>
      <PlanForm
        mode="edit"
        initialData={plan}
        submitLabel="Salvar alterações"
        onSubmit={async (values) => {
          const trial = values.trial_days?.trim() ? Number(values.trial_days) : null;
          await adminBillingService.updatePlan(plan.id, {
            name: values.name,
            description: values.description || null,
            features: values.features_text
              ? values.features_text.split("\n").map((item) => item.trim()).filter(Boolean)
              : [],
            price: values.price,
            cycle: values.cycle,
            is_active: values.is_active,
            sort_order: values.sort_order,
            trial_days: Number.isFinite(trial) ? trial : null,
          });
          toast.success("Plano atualizado.");
          router.push("/dashboard/planos" as Route);
        }}
      />
    </div>
  );
}
