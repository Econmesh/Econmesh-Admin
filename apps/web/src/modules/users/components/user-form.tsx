"use client";

import { Button } from "@econmesh-admin/ui/components/button";
import { Label } from "@econmesh-admin/ui/components/label";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import {
  AuthForm,
  FormField,
  FormInput,
  useFormErrors,
} from "@/modules/auth/components/auth-form";
import {
  adminUserCreateSchema,
  adminUserUpdateSchema,
  ROLE_OPTIONS,
  type AdminUserCreateFormValues,
  type AdminUserUpdateFormValues,
} from "@/modules/users/schemas";
import type { AdminUserListItem } from "@/types/api";
import { ApiError } from "@/utils/errors";

type UserCreateFormProps = {
  mode: "create";
  onSubmit: (values: AdminUserCreateFormValues) => Promise<void>;
  submitLabel: string;
};

type UserEditFormProps = {
  mode: "edit";
  initialData: AdminUserListItem;
  onSubmit: (values: AdminUserUpdateFormValues) => Promise<void>;
  submitLabel: string;
};

export function UserForm(props: UserCreateFormProps | UserEditFormProps) {
  const { errors, setErrors, clear } = useFormErrors<string>();
  const [loading, setLoading] = useState(false);

  async function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
    if (props.mode !== "create") return;
    clear();
    const form = new FormData(event.currentTarget);
    const values = {
      full_name: String(form.get("full_name") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? "") || undefined,
      password: String(form.get("password") ?? ""),
      password_confirm: String(form.get("password_confirm") ?? ""),
      role: String(form.get("role") ?? "viewer") as AdminUserCreateFormValues["role"],
      auto_confirm: form.get("auto_confirm") === "on",
    };

    const parsed = adminUserCreateSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "");
        if (key) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      await props.onSubmit(parsed.data);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Não foi possível salvar o usuário.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    if (props.mode !== "edit") return;
    clear();
    const form = new FormData(event.currentTarget);
    const values = {
      name: String(form.get("name") ?? "") || undefined,
      phone: String(form.get("phone") ?? "") || null,
      role: String(form.get("role") ?? "") as AdminUserUpdateFormValues["role"],
      is_active: form.get("is_active") === "on",
    };

    const parsed = adminUserUpdateSchema.safeParse(values);
    if (!parsed.success) {
      toast.error("Verifique os campos do formulário.");
      return;
    }

    setLoading(true);
    try {
      await props.onSubmit(parsed.data);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Não foi possível atualizar o usuário.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (props.mode === "create") {
    return (
      <AuthForm
        onSubmit={handleCreateSubmit}
        submitLabel={props.submitLabel}
        loading={loading}
      >
        <FormField id="full_name" label="Nome completo" error={errors.full_name}>
          <FormInput id="full_name" name="full_name" required />
        </FormField>
        <FormField id="email" label="E-mail" error={errors.email}>
          <FormInput id="email" name="email" type="email" required />
        </FormField>
        <FormField id="phone" label="Telefone" error={errors.phone}>
          <FormInput id="phone" name="phone" type="tel" />
        </FormField>
        <FormField id="role" label="Perfil" error={errors.role}>
          <select
            id="role"
            name="role"
            defaultValue="viewer"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField id="password" label="Senha" error={errors.password}>
          <FormInput id="password" name="password" type="password" required />
        </FormField>
        <FormField id="password_confirm" label="Confirmar senha" error={errors.password_confirm}>
          <FormInput id="password_confirm" name="password_confirm" type="password" required />
        </FormField>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="auto_confirm"
            name="auto_confirm"
            defaultChecked
            className="size-4 rounded border border-input"
          />
          <Label htmlFor="auto_confirm">Confirmar conta automaticamente</Label>
        </div>
      </AuthForm>
    );
  }

  const { initialData } = props;

  return (
    <AuthForm
      onSubmit={handleEditSubmit}
      submitLabel={props.submitLabel}
      loading={loading}
    >
      <FormField id="name" label="Nome" error={errors.name}>
        <FormInput
          id="name"
          name="name"
          defaultValue={initialData.name ?? ""}
          required
        />
      </FormField>
      <FormField id="phone" label="Telefone" error={errors.phone}>
        <FormInput
          id="phone"
          name="phone"
          type="tel"
          defaultValue={initialData.phone ?? ""}
        />
      </FormField>
      <FormField id="role" label="Perfil" error={errors.role}>
        <select
          id="role"
          name="role"
          defaultValue={initialData.role}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </FormField>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_active"
          name="is_active"
          defaultChecked={initialData.is_active}
          className="size-4 rounded border border-input"
        />
        <Label htmlFor="is_active">Conta ativa</Label>
      </div>
      <p className="text-sm text-muted-foreground">
        E-mail: {initialData.email} · Firebase UID: {initialData.firebase_uid}
      </p>
    </AuthForm>
  );
}
