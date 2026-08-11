export const CONTRACT_PROPOSAL_STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  pending_approval: "Aguardando aprovação",
  changes_requested: "Alterações solicitadas",
  approved: "Aprovada",
  rejected: "Rejeitada",
  sent_to_agreements: "Enviada para Acordos",
};

export const CONTRACT_TYPE_LABELS: Record<string, string> = {
  servico: "Serviço",
  fornecimento: "Fornecimento",
  parceria: "Parceria",
  outro: "Outro",
};

export function formatProposalDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
