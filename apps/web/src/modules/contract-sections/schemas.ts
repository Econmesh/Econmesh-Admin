import { z } from "zod";

export const CONTRACT_TYPE_OPTIONS = [
  { value: "servico" as const, label: "Serviço" },
  { value: "fornecimento" as const, label: "Fornecimento" },
  { value: "parceria" as const, label: "Parceria" },
  { value: "outro" as const, label: "Outro" },
  { value: "oportunidades" as const, label: "Oportunidades" },
  { value: "todos" as const, label: "Todos os tipos" },
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
  contract_type: z.enum([
    "servico",
    "fornecimento",
    "parceria",
    "outro",
    "oportunidades",
    "todos",
  ]),
  sort_order: z.coerce.number().int().min(0),
  is_active: z.boolean().default(true),
  is_company_editable: z.boolean().default(false),
});

export type ContractSectionFormValues = z.infer<typeof contractSectionSchema>;
