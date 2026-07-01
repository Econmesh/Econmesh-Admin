import { z } from "zod";

export const CHANNEL_OPTIONS = [
  { value: "in_app" as const, label: "No aplicativo" },
  { value: "email" as const, label: "E-mail" },
];

export const TARGET_TYPE_OPTIONS = [
  { value: "all" as const, label: "Todos os usuários" },
  { value: "users" as const, label: "Usuários específicos" },
  { value: "groups" as const, label: "Grupos" },
];

export const CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  scheduled: "Agendada",
  processing: "Enviando",
  sent: "Enviada",
  failed: "Falhou",
  cancelled: "Cancelada",
};

export const notificationGroupCreateSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres."),
  description: z.string().max(500).optional(),
  user_ids: z.array(z.string().uuid()).default([]),
});

export const notificationGroupUpdateSchema = notificationGroupCreateSchema.partial();

export const notificationCampaignCreateSchema = z
  .object({
    title: z.string().min(2, "Título deve ter pelo menos 2 caracteres."),
    body: z.string().min(2, "Mensagem deve ter pelo menos 2 caracteres."),
    channels: z.array(z.enum(["in_app", "email"])).min(1, "Selecione ao menos um canal."),
    target_type: z.enum(["all", "users", "groups"]),
    target_user_ids: z.array(z.string().uuid()).default([]),
    target_group_ids: z.array(z.string().uuid()).default([]),
    send_now: z.boolean().default(true),
    send_at: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.target_type === "users" && data.target_user_ids.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Selecione ao menos um usuário.",
        path: ["target_user_ids"],
      });
    }
    if (data.target_type === "groups" && data.target_group_ids.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Selecione ao menos um grupo.",
        path: ["target_group_ids"],
      });
    }
    if (!data.send_now && !data.send_at) {
      ctx.addIssue({
        code: "custom",
        message: "Informe a data e hora do agendamento.",
        path: ["send_at"],
      });
    }
  });

export type NotificationGroupCreateFormValues = z.infer<typeof notificationGroupCreateSchema>;
export type NotificationGroupUpdateFormValues = z.infer<typeof notificationGroupUpdateSchema>;
export type NotificationCampaignCreateFormValues = z.infer<
  typeof notificationCampaignCreateSchema
>;
