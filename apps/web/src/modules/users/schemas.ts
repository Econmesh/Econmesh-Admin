import { z } from "zod";

import type { Role } from "@/types/api";

export const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "viewer", label: "Visualizador" },
  { value: "analyst", label: "Analista" },
  { value: "operator", label: "Operador" },
  { value: "admin", label: "Administrador" },
];

export const adminUserCreateSchema = z
  .object({
    full_name: z.string().min(2, "Nome obrigatório"),
    email: z.string().email("E-mail inválido"),
    phone: z.string().optional(),
    password: z.string().min(8, "Mínimo 8 caracteres"),
    password_confirm: z.string().min(8, "Confirme a senha"),
    role: z.enum(["admin", "operator", "analyst", "viewer", "service"]),
    auto_confirm: z.boolean().default(true),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: "As senhas não coincidem",
    path: ["password_confirm"],
  });

export type AdminUserCreateFormValues = z.infer<typeof adminUserCreateSchema>;

export const adminUserUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional().nullable(),
  role: z.enum(["admin", "operator", "analyst", "viewer", "service"]).optional(),
  is_active: z.boolean().optional(),
});

export type AdminUserUpdateFormValues = z.infer<typeof adminUserUpdateSchema>;
