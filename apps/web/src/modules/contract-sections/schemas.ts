import { z } from "zod";

import type { OpportunityType } from "@/types/api";

export const OPPORTUNITY_TYPE_OPTIONS: {
  value: OpportunityType;
  label: string;
}[] = [
  { value: "comercializacao", label: "Comercialização" },
  { value: "simbiose_industrial", label: "Simbiose Industrial" },
  { value: "compartilhamento", label: "Compartilhamento de ativos" },
];

export const CONTRACT_TYPE_LABELS: Record<string, string> = {
  servico: "Serviço",
  fornecimento: "Fornecimento",
  parceria: "Parceria",
  outro: "Outro",
  oportunidades: "Oportunidades",
  todos: "Todos os tipos",
};

export const contractSectionSchema = z.object({
  title: z.string().min(2, "Título deve ter pelo menos 2 caracteres."),
  content_html: z.string().min(1, "Conteúdo é obrigatório."),
  opportunity_types: z
    .array(
      z.enum(["comercializacao", "simbiose_industrial", "compartilhamento"]),
    )
    .min(1, "Selecione pelo menos um tipo de oportunidade."),
  sort_order: z.coerce.number().int().min(0),
  is_active: z.boolean().default(true),
  is_company_editable: z.boolean().default(false),
});

export type ContractSectionFormValues = z.infer<typeof contractSectionSchema>;
