"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import {
  AuthForm,
  FormField,
  FormInput,
  useFormErrors,
} from "@/modules/auth/components/auth-form";
import {
  CONTRACT_TYPE_OPTIONS,
  contractSectionSchema,
  type ContractSectionFormValues,
} from "@/modules/contract-sections/schemas";
import type { ContractSection } from "@/types/api";
import { ApiError } from "@/utils/errors";

type ContractSectionFormProps = {
  mode: "create" | "edit";
  initialData?: ContractSection;
  submitLabel: string;
  onSubmit: (values: ContractSectionFormValues) => Promise<void>;
};

export function ContractSectionForm({
  mode,
  initialData,
  submitLabel,
  onSubmit,
}: ContractSectionFormProps) {
  const { errors, setErrors, clear } = useFormErrors<string>();
  const [loading, setLoading] = useState(false);
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [isCompanyEditable, setIsCompanyEditable] = useState(
    initialData?.is_company_editable ?? false,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clear();
    const form = new FormData(event.currentTarget);
    const values = {
      title: String(form.get("title") ?? ""),
      content_html: String(form.get("content_html") ?? ""),
      contract_type: String(form.get("contract_type") ?? "servico"),
      sort_order: Number(form.get("sort_order") ?? 0),
      is_active: isActive,
      is_company_editable: isCompanyEditable,
    };

    const parsed = contractSectionSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string") fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error("Verifique os campos do formulário.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit(parsed.data);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Não foi possível salvar a seção.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthForm onSubmit={handleSubmit} loading={loading} submitLabel={submitLabel}>
      <FormField label="Título" id="title" error={errors.title}>
        <FormInput
          id="title"
          name="title"
          defaultValue={mode === "edit" ? initialData?.title : ""}
          required
        />
      </FormField>

      <FormField
        label="Aplicar a"
        id="contract_type"
        error={errors.contract_type}
      >
        <select
          id="contract_type"
          name="contract_type"
          defaultValue={mode === "edit" ? initialData?.contract_type : "servico"}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {CONTRACT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-muted-foreground">
          Escolha um tipo específico, oportunidades ou todos os tipos de contrato.
        </p>
      </FormField>



      <FormField label="Conteúdo (HTML)" id="content_html" error={errors.content_html}>
        <textarea
          id="content_html"
          name="content_html"
          rows={10}
          defaultValue={mode === "edit" ? (initialData?.content_html ?? "") : ""}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
          required
        />
      </FormField>

      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="size-4 rounded border-input"
        />
        Seção ativa
      </label>

      <label className="flex cursor-pointer items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={isCompanyEditable}
          onChange={(e) => setIsCompanyEditable(e.target.checked)}
          className="mt-0.5 size-4 rounded border-input"
        />
        <span>
          Editável pelas empresas
          <span className="mt-0.5 block text-xs text-muted-foreground">
            Por padrão as seções administrativas não podem ser alteradas. Marque
            apenas se a empresa puder editar o conteúdo durante a negociação.
          </span>
        </span>
      </label>
    </AuthForm>
  );
}
