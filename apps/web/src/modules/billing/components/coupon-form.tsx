"use client";

import { Button } from "@econmesh-admin/ui/components/button";
import { Input } from "@econmesh-admin/ui/components/input";
import { Label } from "@econmesh-admin/ui/components/label";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { couponFormSchema, type CouponFormValues } from "@/modules/billing/schemas";
import type { BillingCoupon } from "@/types/api";
import { ApiError } from "@/utils/errors";

type CouponFormProps = {
  mode: "create" | "edit";
  initialData?: BillingCoupon;
  submitLabel: string;
  onSubmit: (values: CouponFormValues) => Promise<void>;
};

export function CouponForm({ mode, initialData, submitLabel, onSubmit }: CouponFormProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values = {
      code: String(form.get("code") ?? ""),
      discount_type: String(form.get("discount_type") ?? "PERCENTAGE"),
      discount_value: String(form.get("discount_value") ?? "0"),
      valid_until: String(form.get("valid_until") ?? ""),
      max_uses: String(form.get("max_uses") ?? ""),
      is_active: form.get("is_active") === "on",
    };
    const parsed = couponFormSchema.safeParse(values);
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
      toast.error(error instanceof ApiError ? error.message : "Não foi possível salvar o cupom.");
    } finally {
      setLoading(false);
    }
  }

  const defaultUntil = initialData?.valid_until
    ? initialData.valid_until.slice(0, 10)
    : "";

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="max-w-xl space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="code">Código</Label>
        <Input
          id="code"
          name="code"
          defaultValue={initialData?.code}
          disabled={mode === "edit"}
          required
        />
        {errors.code ? <p className="text-sm text-destructive">{errors.code}</p> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="discount_type">Tipo</Label>
          <select
            id="discount_type"
            name="discount_type"
            defaultValue={initialData?.discount_type ?? "PERCENTAGE"}
            className="h-8 w-full rounded-none border border-input bg-background px-2 text-sm"
          >
            <option value="PERCENTAGE">Percentual (%)</option>
            <option value="FIXED">Valor fixo (R$)</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="discount_value">Valor</Label>
          <Input
            id="discount_value"
            name="discount_value"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={initialData?.discount_value ?? 10}
            required
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="valid_until">Válido até</Label>
          <Input id="valid_until" name="valid_until" type="date" defaultValue={defaultUntil} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max_uses">Máximo de usos</Label>
          <Input
            id="max_uses"
            name="max_uses"
            type="number"
            min="1"
            defaultValue={initialData?.max_uses ?? ""}
            placeholder="Ilimitado"
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_active" defaultChecked={initialData?.is_active ?? true} />
        Cupom ativo
      </label>
      <Button type="submit" disabled={loading}>
        {loading ? "Salvando…" : submitLabel}
      </Button>
    </form>
  );
}
