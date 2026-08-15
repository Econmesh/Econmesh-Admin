"use client";

import { Skeleton } from "@econmesh-admin/ui/components/skeleton";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { BillingSettingsForm } from "@/modules/billing/components/settings-form";
import { adminBillingService } from "@/services/admin/billing.service";
import type { BillingSettings } from "@/types/api";
import { ApiError } from "@/utils/errors";

export default function CobrancaConfigPage() {
  const [settings, setSettings] = useState<BillingSettings | null>(null);

  useEffect(() => {
    void adminBillingService
      .getSettings()
      .then(setSettings)
      .catch((error) => {
        toast.error(
          error instanceof ApiError ? error.message : "Não foi possível carregar as configurações.",
        );
      });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Valores gerais</h1>
        <p className="text-sm text-muted-foreground">
          Trial, meios de pagamento, multa, juros e carência.
        </p>
      </div>
      {settings ? <BillingSettingsForm initialData={settings} /> : <Skeleton className="h-64 rounded-xl" />}
    </div>
  );
}
