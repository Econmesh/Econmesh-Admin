"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { PlanForm } from "@/modules/billing/components/plan-form";
import { adminBillingService } from "@/services/admin/billing.service";

export default function NovoPlanoPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href={"/dashboard/planos" as Route} className="hover:underline">
            Planos
          </Link>
          {" / "}Novo plano
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Cadastrar plano</h1>
      </div>
      <PlanForm
        mode="create"
        submitLabel="Criar plano"
        onSubmit={async (values) => {
          const trial = values.trial_days?.trim() ? Number(values.trial_days) : null;
          await adminBillingService.createPlan({
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
          toast.success("Plano criado.");
          router.push("/dashboard/planos" as Route);
        }}
      />
    </div>
  );
}
