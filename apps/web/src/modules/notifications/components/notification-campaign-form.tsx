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
  CHANNEL_OPTIONS,
  TARGET_TYPE_OPTIONS,
  notificationCampaignCreateSchema,
  type NotificationCampaignCreateFormValues,
} from "@/modules/notifications/schemas";
import type { AdminUserListItem, NotificationGroup } from "@/types/api";
import { ApiError } from "@/utils/errors";

type NotificationCampaignFormProps = {
  users: AdminUserListItem[];
  groups: NotificationGroup[];
  onSubmit: (values: NotificationCampaignCreateFormValues) => Promise<void>;
  submitLabel: string;
};

export function NotificationCampaignForm({
  users,
  groups,
  onSubmit,
  submitLabel,
}: NotificationCampaignFormProps) {
  const { errors, setErrors, clear } = useFormErrors<string>();
  const [loading, setLoading] = useState(false);
  const [channels, setChannels] = useState<Array<"in_app" | "email">>(["in_app"]);
  const [targetType, setTargetType] = useState<"all" | "users" | "groups">("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [sendNow, setSendNow] = useState(true);

  function toggleChannel(channel: "in_app" | "email") {
    setChannels((prev) =>
      prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel],
    );
  }

  function toggleUser(userId: string) {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  }

  function toggleGroup(groupId: string) {
    setSelectedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clear();
    const form = new FormData(event.currentTarget);
    const sendAtLocal = String(form.get("send_at") ?? "");
    const sendAt = sendAtLocal ? new Date(sendAtLocal).toISOString() : undefined;

    const values = {
      title: String(form.get("title") ?? ""),
      body: String(form.get("body") ?? ""),
      channels,
      target_type: targetType,
      target_user_ids: selectedUsers,
      target_group_ids: selectedGroups,
      send_now: sendNow,
      send_at: sendAt,
    };

    const parsed = notificationCampaignCreateSchema.safeParse(values);
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
        error instanceof ApiError ? error.message : "Não foi possível enviar a notificação.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthForm onSubmit={handleSubmit} loading={loading} submitLabel={submitLabel}>
      <FormField label="Título" htmlFor="title" error={errors.title}>
        <FormInput id="title" name="title" required />
      </FormField>

      <FormField label="Mensagem" htmlFor="body" error={errors.body}>
        <textarea
          id="body"
          name="body"
          rows={5}
          required
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </FormField>

      <div className="space-y-2">
        <Label>Canais</Label>
        <div className="flex flex-wrap gap-4">
          {CHANNEL_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={channels.includes(option.value)}
                onChange={() => toggleChannel(option.value)}
                className="size-4 rounded border-input"
              />
              {option.label}
            </label>
          ))}
        </div>
        {errors.channels ? (
          <p className="text-sm text-destructive" role="alert">
            {errors.channels}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label>Destinatários</Label>
        <div className="flex flex-wrap gap-4">
          {TARGET_TYPE_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="target_type"
                checked={targetType === option.value}
                onChange={() => setTargetType(option.value)}
                className="size-4"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      {targetType === "users" ? (
        <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-input p-3">
          {users.map((user) => (
            <label key={user.id} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedUsers.includes(user.id)}
                onChange={() => toggleUser(user.id)}
                className="size-4 rounded border-input"
              />
              <span>{user.name ?? user.email ?? user.id}</span>
            </label>
          ))}
        </div>
      ) : null}

      {targetType === "groups" ? (
        <div className="space-y-2 rounded-md border border-input p-3">
          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum grupo cadastrado.</p>
          ) : (
            groups.map((group) => (
              <label key={group.id} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedGroups.includes(group.id)}
                  onChange={() => toggleGroup(group.id)}
                  className="size-4 rounded border-input"
                />
                <span>
                  {group.name} ({group.user_ids.length} usuários)
                </span>
              </label>
            ))
          )}
        </div>
      ) : null}

      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={sendNow}
            onChange={(e) => setSendNow(e.target.checked)}
            className="size-4 rounded border-input"
          />
          Enviar agora
        </label>
        {!sendNow ? (
          <FormField label="Agendar para" htmlFor="send_at" error={errors.send_at}>
            <FormInput id="send_at" name="send_at" type="datetime-local" required={!sendNow} />
          </FormField>
        ) : null}
      </div>
    </AuthForm>
  );
}
