"use client";

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
  notificationGroupCreateSchema,
  type NotificationGroupCreateFormValues,
  type NotificationGroupUpdateFormValues,
} from "@/modules/notifications/schemas";
import type { AdminUserListItem, NotificationGroup } from "@/types/api";
import { ApiError } from "@/utils/errors";

type CreateProps = {
  mode: "create";
  users: AdminUserListItem[];
  onSubmit: (values: NotificationGroupCreateFormValues) => Promise<void>;
  submitLabel: string;
};

type EditProps = {
  mode: "edit";
  initialData: NotificationGroup;
  users: AdminUserListItem[];
  onSubmit: (values: NotificationGroupUpdateFormValues) => Promise<void>;
  submitLabel: string;
};

export function NotificationGroupForm(props: CreateProps | EditProps) {
  const { errors, setErrors, clear } = useFormErrors<string>();
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>(
    props.mode === "edit" ? props.initialData.user_ids : [],
  );

  function toggleUser(userId: string) {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clear();
    const form = new FormData(event.currentTarget);
    const values = {
      name: String(form.get("name") ?? ""),
      description: String(form.get("description") ?? "") || undefined,
      user_ids: selectedUsers,
    };

    const parsed = notificationGroupCreateSchema.safeParse(values);
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
      await props.onSubmit(parsed.data);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Não foi possível salvar o grupo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthForm onSubmit={handleSubmit} loading={loading} submitLabel={props.submitLabel}>
      <FormField label="Nome" id="name" error={errors.name}>
        <FormInput
          id="name"
          name="name"
          defaultValue={props.mode === "edit" ? props.initialData.name : ""}
          required
        />
      </FormField>

      <FormField label="Descrição" id="description" error={errors.description}>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={props.mode === "edit" ? (props.initialData.description ?? "") : ""}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </FormField>

      <div className="space-y-2">
        <Label>Membros do grupo</Label>
        <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border border-input p-3">
          {props.users.map((user) => (
            <label key={user.id} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedUsers.includes(user.id)}
                onChange={() => toggleUser(user.id)}
                className="size-4 rounded border-input"
              />
              <span>
                {user.name ?? user.email ?? user.id}{" "}
                <span className="text-muted-foreground">({user.role})</span>
              </span>
            </label>
          ))}
        </div>
        {errors.user_ids ? (
          <p className="text-sm text-destructive" role="alert">
            {errors.user_ids}
          </p>
        ) : null}
      </div>
    </AuthForm>
  );
}
