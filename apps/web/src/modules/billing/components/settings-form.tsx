"use client";

import { Button } from "@econmesh-admin/ui/components/button";
import { Input } from "@econmesh-admin/ui/components/input";
import { Label } from "@econmesh-admin/ui/components/label";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { adminBillingService } from "@/services/admin/billing.service";
import type { BillingSettings, BillingType } from "@/types/api";
import { ApiError } from "@/utils/errors";

const BILLING_OPTIONS: { value: BillingType; label: string }[] = [
  { value: "PIX", label: "Pix" },
  { value: "BOLETO", label: "Boleto" },
  { value: "CREDIT_CARD", label: "Cartão de crédito" },
];

export function BillingSettingsForm({ initialData }: { initialData: BillingSettings }) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const allowed = BILLING_OPTIONS.filter((option) => form.get(`type_${option.value}`) === "on").map(
      (option) => option.value,
    );
    setLoading(true);
    try {
      await adminBillingService.updateSettings({
        trial_enabled: form.get("trial_enabled") === "on",
        default_trial_days: Number(form.get("default_trial_days") || 0),
        allowed_billing_types: allowed,
        fine_value: Number(form.get("fine_value") || 0),
        fine_type: String(form.get("fine_type") || "PERCENTAGE") as BillingSettings["fine_type"],
        interest_value: Number(form.get("interest_value") || 0),
        grace_period_days: Number(form.get("grace_period_days") || 0),
      });
      toast.success("Configurações salvas.");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Não foi possível salvar as configurações.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="max-w-xl space-y-4">
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="trial_enabled" defaultChecked={initialData.trial_enabled} />
        Período de teste habilitado
      </label>
      <div className="space-y-2">
        <Label htmlFor="default_trial_days">Dias de trial padrão</Label>
        <Input
          id="default_trial_days"
          name="default_trial_days"
          type="number"
          min="0"
          defaultValue={initialData.default_trial_days}
        />
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Meios de pagamento</legend>
        {BILLING_OPTIONS.map((option) => (
          <label key={option.value} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name={`type_${option.value}`}
              defaultChecked={initialData.allowed_billing_types.includes(option.value)}
            />
            {option.label}
          </label>
        ))}
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fine_value">Multa</Label>
          <Input
            id="fine_value"
            name="fine_value"
            type="number"
            step="0.01"
            min="0"
            defaultValue={initialData.fine_value}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fine_type">Tipo da multa</Label>
          <select
            id="fine_type"
            name="fine_type"
            defaultValue={initialData.fine_type}
            className="h-8 w-full rounded-none border border-input bg-background px-2 text-sm"
          >
            <option value="PERCENTAGE">Percentual</option>
            <option value="FIXED">Valor fixo</option>
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="interest_value">Juros ao mês (%)</Label>
          <Input
            id="interest_value"
            name="interest_value"
            type="number"
            step="0.01"
            min="0"
            defaultValue={initialData.interest_value}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="grace_period_days">Carência (dias)</Label>
          <Input
            id="grace_period_days"
            name="grace_period_days"
            type="number"
            min="0"
            defaultValue={initialData.grace_period_days}
          />
        </div>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Salvando…" : "Salvar configurações"}
      </Button>
    </form>
  );
}
