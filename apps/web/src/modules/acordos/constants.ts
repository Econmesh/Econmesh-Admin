import type { AgreementStatus } from "@/types/api";

export const AGREEMENT_STATUS_LABELS: Record<AgreementStatus, string> = {
	draft: "Rascunho",
	awaiting_send: "Aguardando envio",
	awaiting_signatures: "Aguardando assinaturas",
	partially_signed: "Parcialmente assinado",
	signed: "Assinado",
	rejected: "Rejeitado",
	cancelled: "Cancelado",
	expired: "Expirado",
};

export function formatAgreementDate(value: string): string {
	return new Date(value).toLocaleString("pt-BR", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}
