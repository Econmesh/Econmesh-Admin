"use client";

import { Button } from "@econmesh-admin/ui/components/button";
import { Input } from "@econmesh-admin/ui/components/input";
import { Label } from "@econmesh-admin/ui/components/label";
import { Textarea } from "@econmesh-admin/ui/components/textarea";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { adminBillingService } from "@/services/admin/billing.service";
import { ApiError } from "@/utils/errors";

type GrantAccessFormProps = {
  userId?: string;
  companyId?: string;
  submitLabel?: string;
  onGranted: () => void;
};

function defaultExpiresLocal(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function localDateTimeToIso(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  );
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function GrantAccessForm({
  userId,
  companyId,
  submitLabel = "Liberar acesso",
  onGranted,
}: GrantAccessFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const fieldId = userId || companyId || "new";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId && !companyId) {
      toast.error("Selecione um usuário ou uma empresa.");
      return;
    }
    const form = event.currentTarget;
    const data = new FormData(form);
    const expiresLocal = String(data.get("expires_at") ?? "");
    const reason = String(data.get("reason") ?? "").trim();
    const expiresAt = localDateTimeToIso(expiresLocal);
    if (!expiresAt) {
      toast.error("Informe um prazo válido.");
      return;
    }
    setSubmitting(true);
    try {
      await adminBillingService.createAccessGrant({
        ...(userId ? { user_id: userId } : {}),
        ...(companyId ? { company_id: companyId } : {}),
        expires_at: expiresAt,
        reason: reason || undefined,
      });
      toast.success("Acesso excepcional liberado.");
      form.reset();
      onGranted();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Não foi possível liberar o acesso.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-3" onSubmit={(event) => void handleSubmit(event)}>
      <div className="space-y-1.5">
        <Label htmlFor={`expires-at-${fieldId}`}>Prazo</Label>
        <Input
          id={`expires-at-${fieldId}`}
          name="expires_at"
          type="datetime-local"
          defaultValue={defaultExpiresLocal()}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`reason-${fieldId}`}>Motivo (opcional)</Label>
        <Textarea id={`reason-${fieldId}`} name="reason" rows={2} maxLength={500} />
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Liberando…" : submitLabel}
      </Button>
    </form>
  );
}
