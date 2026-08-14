"use client";

import { Button } from "@econmesh-admin/ui/components/button";
import { Input } from "@econmesh-admin/ui/components/input";
import { Label } from "@econmesh-admin/ui/components/label";
import { Textarea } from "@econmesh-admin/ui/components/textarea";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { planFormSchema, type PlanFormValues } from "@/modules/billing/schemas";
import type { BillingPlan } from "@/types/api";
import { ApiError } from "@/utils/errors";

type PlanFormProps = {
  mode: "create" | "edit";
  initialData?: BillingPlan;
  submitLabel: string;
  onSubmit: (values: PlanFormValues) => Promise<void>;
};

export function PlanForm({ initialData, submitLabel, onSubmit }: PlanFormProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values = {
      name: String(form.get("name") ?? ""),
      description: String(form.get("description") ?? ""),
      features_text: String(form.get("features_text") ?? ""),
      price: String(form.get("price") ?? "0"),
      cycle: String(form.get("cycle") ?? "MONTHLY"),
      is_active: form.get("is_active") === "on",
      sort_order: String(form.get("sort_order") ?? "0"),
      trial_days: String(form.get("trial_days") ?? ""),
    };
    const parsed = planFormSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "");
        if (key) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await onSubmit(parsed.data);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Não foi possível salvar o plano.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="max-w-xl space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" defaultValue={initialData?.name} required />
        {errors.name ? <p className="text-sm text-destructive">{errors.name}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" name="description" defaultValue={initialData?.description ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="features_text">Recursos (um por linha)</Label>
        <Textarea
          id="features_text"
          name="features_text"
          defaultValue={initialData?.features.join("\n") ?? ""}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="price">Valor (R$)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={initialData?.price ?? 0}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cycle">Ciclo</Label>
          <select
            id="cycle"
            name="cycle"
            defaultValue={initialData?.cycle ?? "MONTHLY"}
            className="h-8 w-full rounded-none border border-input bg-background px-2 text-sm"
          >
            <option value="MONTHLY">Mensal</option>
            <option value="YEARLY">Anual</option>
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sort_order">Ordem</Label>
          <Input
            id="sort_order"
            name="sort_order"
            type="number"
            min="0"
            defaultValue={initialData?.sort_order ?? 0}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="trial_days">Trial específico (dias)</Label>
          <Input
            id="trial_days"
            name="trial_days"
            type="number"
            min="0"
            defaultValue={initialData?.trial_days ?? ""}
            placeholder="Usar padrão global"
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_active" defaultChecked={initialData?.is_active ?? true} />
        Plano ativo
      </label>
      <Button type="submit" disabled={loading}>
        {loading ? "Salvando…" : submitLabel}
      </Button>
    </form>
  );
}
