import { z } from "zod";

export const planFormSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  description: z.string().optional(),
  features_text: z.string().optional(),
  price: z.coerce.number().min(0, "Valor inválido"),
  cycle: z.enum(["MONTHLY", "YEARLY"]),
  is_active: z.boolean(),
  sort_order: z.coerce.number().int().min(0),
  trial_days: z.string().optional(),
});

export type PlanFormValues = z.infer<typeof planFormSchema>;

export const couponFormSchema = z.object({
  code: z.string().min(3, "Código obrigatório"),
  discount_type: z.enum(["PERCENTAGE", "FIXED"]),
  discount_value: z.coerce.number().positive("Valor inválido"),
  valid_until: z.string().optional(),
  max_uses: z.string().optional(),
  is_active: z.boolean(),
});

export type CouponFormValues = z.infer<typeof couponFormSchema>;

export function formatMoneyBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
