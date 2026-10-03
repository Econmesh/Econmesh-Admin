"use client";

import { Button } from "@econmesh-admin/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@econmesh-admin/ui/components/card";
import { Input } from "@econmesh-admin/ui/components/input";
import { Textarea } from "@econmesh-admin/ui/components/textarea";
import { useState, type FormEvent, type ReactNode } from "react";
import { z } from "zod";

import { useCepLookup } from "@/modules/companies/hooks/use-cep-lookup";
import {
  BRAZILIAN_STATES,
  formatCep,
  formatCnpj,
  formatPhone,
  isValidCnpj,
} from "@/modules/companies/schemas";
import type { DmcCompany, DmcPreRegistrationPayload } from "@/services/dmc/dmc.service";
import { ApiError, getValidationFieldErrors } from "@/utils/errors";

function digits(value: string): string {
  return value.replace(/\D/g, "");
}

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

// Pré-cadastro: só razão social e CNPJ são obrigatórios. O responsável
// completa o restante quando fizer o cadastro no app.
const preRegistrationSchema = z.object({
  legal_name: z.string().trim().min(2, "Informe a razão social.").max(200),
  trade_name: optionalText(200),
  tax_id: z.string().trim().refine(isValidCnpj, "CNPJ inválido."),
  email: z.string().trim().email("E-mail inválido.").optional().or(z.literal("")),
  phone: z
    .string()
    .trim()
    .refine((v) => v === "" || digits(v).length >= 8, "Telefone inválido.")
    .optional(),
  legal_representative: optionalText(200),
  sector: optionalText(100),
  website: z.string().trim().url("URL inválida.").optional().or(z.literal("")),
  description: optionalText(2000),
  postal_code: optionalText(12),
  street: optionalText(200),
  number: optionalText(20),
  complement: optionalText(100),
  neighborhood: optionalText(100),
  city: optionalText(100),
  state: optionalText(2),
});

type FormValues = z.infer<typeof preRegistrationSchema>;
type FieldKey = keyof FormValues;

function initialValues(company?: DmcCompany | null): Record<FieldKey, string> {
  const address = company?.address;
  return {
    legal_name: company?.legal_name ?? "",
    trade_name: company?.trade_name ?? "",
    tax_id: company?.tax_id ?? "",
    email: company?.email ?? "",
    phone: company?.phone ?? "",
    legal_representative: company?.legal_representative ?? "",
    sector: company?.sector ?? "",
    website: company?.website ?? "",
    description: company?.description ?? "",
    postal_code: address?.postal_code ?? "",
    street: address?.street ?? "",
    number: address?.number ?? "",
    complement: address?.complement ?? "",
    neighborhood: address?.neighborhood ?? "",
    city: address?.city ?? company?.city ?? "",
    state: address?.state ?? company?.state ?? "",
  };
}

function toPayload(values: FormValues): DmcPreRegistrationPayload {
  const orNull = (value?: string) => (value && value.trim() ? value.trim() : null);
  const address = {
    postal_code: orNull(digits(values.postal_code ?? "")),
    street: orNull(values.street),
    number: orNull(values.number),
    complement: orNull(values.complement),
    neighborhood: orNull(values.neighborhood),
    city: orNull(values.city),
    state: orNull(values.state),
  };
  const hasAddress = Object.values(address).some((value) => value !== null);
  return {
    legal_name: values.legal_name.trim(),
    trade_name: orNull(values.trade_name),
    tax_id: digits(values.tax_id),
    email: orNull(values.email),
    phone: orNull(digits(values.phone ?? "")),
    legal_representative: orNull(values.legal_representative),
    sector: orNull(values.sector),
    website: orNull(values.website),
    description: orNull(values.description),
    address: hasAddress ? address : null,
  };
}

type Props = {
  company?: DmcCompany | null;
  submitLabel: string;
  onSubmit: (payload: DmcPreRegistrationPayload) => Promise<void>;
  onCancel?: () => void;
};

export function DmcPreRegistrationForm({ company, submitLabel, onSubmit, onCancel }: Props) {
  const [values, setValues] = useState(() => initialValues(company));
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [saving, setSaving] = useState(false);
  const { lookup: lookupCep, loading: cepLoading } = useCepLookup();

  function set(key: FieldKey, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCepBlur() {
    const result = await lookupCep(values.postal_code);
    if (!result) return;
    setValues((prev) => ({
      ...prev,
      street: result.street || prev.street,
      neighborhood: result.neighborhood || prev.neighborhood,
      city: result.city || prev.city,
      state: result.state || prev.state,
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErrors({});
    const parsed = preRegistrationSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "");
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setSaving(true);
    try {
      await onSubmit(toPayload(parsed.data));
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === "tax_id_exists") {
          setErrors({ tax_id: "Já existe uma empresa com este CNPJ. Pesquise-a no cadastro." });
          return;
        }
        if (error.code === "validation_error") {
          setErrors(getValidationFieldErrors(error.details));
          return;
        }
      }
      throw error;
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-6" noValidate>
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Dados da empresa</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field id="legal_name" label="Razão social *" error={errors.legal_name}>
            <Input
              id="legal_name"
              value={values.legal_name}
              onChange={(e) => set("legal_name", e.target.value)}
              aria-invalid={!!errors.legal_name}
            />
          </Field>
          <Field id="trade_name" label="Nome fantasia" error={errors.trade_name}>
            <Input
              id="trade_name"
              value={values.trade_name}
              onChange={(e) => set("trade_name", e.target.value)}
            />
          </Field>
          <Field id="tax_id" label="CNPJ *" error={errors.tax_id}>
            <Input
              id="tax_id"
              inputMode="numeric"
              value={formatCnpj(values.tax_id)}
              onChange={(e) => set("tax_id", e.target.value)}
              aria-invalid={!!errors.tax_id}
            />
          </Field>
          <Field id="sector" label="Setor" error={errors.sector}>
            <Input id="sector" value={values.sector} onChange={(e) => set("sector", e.target.value)} />
          </Field>
          <Field id="email" label="E-mail" error={errors.email}>
            <Input
              id="email"
              type="email"
              value={values.email}
              onChange={(e) => set("email", e.target.value)}
              aria-invalid={!!errors.email}
            />
          </Field>
          <Field id="phone" label="Telefone" error={errors.phone}>
            <Input
              id="phone"
              inputMode="tel"
              value={formatPhone(values.phone)}
              onChange={(e) => set("phone", e.target.value)}
              aria-invalid={!!errors.phone}
            />
          </Field>
          <Field
            id="legal_representative"
            label="Responsável (contato)"
            error={errors.legal_representative}
          >
            <Input
              id="legal_representative"
              value={values.legal_representative}
              onChange={(e) => set("legal_representative", e.target.value)}
            />
          </Field>
          <Field id="website" label="Site" error={errors.website}>
            <Input
              id="website"
              placeholder="https://"
              value={values.website}
              onChange={(e) => set("website", e.target.value)}
              aria-invalid={!!errors.website}
            />
          </Field>
          <div className="md:col-span-2">
            <Field id="description" label="Observações" error={errors.description}>
              <Textarea
                id="description"
                rows={3}
                value={values.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Endereço</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field id="postal_code" label="CEP" error={errors.postal_code}>
            <Input
              id="postal_code"
              inputMode="numeric"
              value={formatCep(values.postal_code)}
              onChange={(e) => set("postal_code", e.target.value)}
              onBlur={() => void handleCepBlur()}
            />
            {cepLoading ? (
              <p className="text-xs text-muted-foreground">Buscando endereço…</p>
            ) : null}
          </Field>
          <Field id="street" label="Rua" error={errors.street}>
            <Input id="street" value={values.street} onChange={(e) => set("street", e.target.value)} />
          </Field>
          <Field id="number" label="Número" error={errors.number}>
            <Input id="number" value={values.number} onChange={(e) => set("number", e.target.value)} />
          </Field>
          <Field id="complement" label="Complemento" error={errors.complement}>
            <Input
              id="complement"
              value={values.complement}
              onChange={(e) => set("complement", e.target.value)}
            />
          </Field>
          <Field id="neighborhood" label="Bairro" error={errors.neighborhood}>
            <Input
              id="neighborhood"
              value={values.neighborhood}
              onChange={(e) => set("neighborhood", e.target.value)}
            />
          </Field>
          <Field id="city" label="Cidade" error={errors.city}>
            <Input id="city" value={values.city} onChange={(e) => set("city", e.target.value)} />
          </Field>
          <Field id="state" label="Estado" error={errors.state}>
            <select
              id="state"
              value={values.state}
              onChange={(e) => set("state", e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              <option value="">Selecione</option>
              {BRAZILIAN_STATES.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </Field>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Salvando…" : submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
