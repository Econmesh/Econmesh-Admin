"use client";

import { Badge } from "@econmesh-admin/ui/components/badge";
import type { Route } from "next";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  CONTRACT_PROPOSAL_STATUS_LABELS,
  CONTRACT_TYPE_LABELS,
  formatProposalDate,
} from "@/modules/minutas/constants";
import { adminContractProposalsService } from "@/services/admin/contract-proposals.service";
import { ApiError } from "@/utils/errors";
import type { ContractProposal } from "@/types/api";

export default function AdminMinutaDetailPage() {
  const params = useParams<{ id: string }>();
  const [proposal, setProposal] = useState<ContractProposal | null>(null);

  useEffect(() => {
    void adminContractProposalsService
      .get(params.id)
      .then(setProposal)
      .catch((err) => {
        toast.error(
          err instanceof ApiError ? err.message : "Minuta não encontrada.",
        );
      });
  }, [params.id]);

  if (!proposal) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }

  const sections = [...proposal.sections].sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={"/dashboard/minutas" as Route}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Minutas
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{proposal.title}</h1>
        <p className="text-sm text-muted-foreground">
          {CONTRACT_TYPE_LABELS[proposal.contract_type] ?? proposal.contract_type}
          {" · "}
          {CONTRACT_PROPOSAL_STATUS_LABELS[proposal.status] ?? proposal.status}
          {" · "}
          Atualizada em {formatProposalDate(proposal.updated_at)}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/dashboard/conversas/${proposal.conversation_id}` as Route}
          className="text-sm text-primary hover:underline"
        >
          Ver conversa
        </Link>
        <span className="text-muted-foreground">·</span>
        <Link
          href={`/dashboard/oportunidades/${proposal.opportunity_id}` as Route}
          className="text-sm text-primary hover:underline"
        >
          Ver oportunidade
        </Link>
        {proposal.agreement_id ? (
          <>
            <span className="text-muted-foreground">·</span>
            <Link
              href={`/dashboard/acordos/${proposal.agreement_id}` as Route}
              className="text-sm text-primary hover:underline"
            >
              Ver acordo
            </Link>
          </>
        ) : null}
      </div>

      {proposal.rejection_reason ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
          <strong>Rejeição:</strong> {proposal.rejection_reason}
        </div>
      ) : null}

      {proposal.change_request_message ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <strong>Alterações solicitadas:</strong>{" "}
          {proposal.change_request_message}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border p-4">
          <h2 className="mb-3 font-semibold">Contratante</h2>
          <PartySummary party={proposal.contractor} />
        </section>
        <section className="rounded-xl border p-4">
          <h2 className="mb-3 font-semibold">Contratada</h2>
          <PartySummary party={proposal.contracted} />
        </section>
      </div>

      <section className="rounded-xl border p-4">
        <h2 className="mb-3 font-semibold">Oportunidade</h2>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>
            <span className="text-foreground">{proposal.opportunity.title}</span>
          </li>
          <li>Categoria: {proposal.opportunity.category}</li>
          <li>
            Valor:{" "}
            {proposal.opportunity.price_negotiable || proposal.opportunity.price == null
              ? "A combinar"
              : `R$ ${proposal.opportunity.price}`}
          </li>
          <li>Prazo: {proposal.opportunity.prazo ?? "—"}</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Seções</h2>
        {sections.map((section) => (
          <article key={section.id} className="rounded-xl border p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h3 className="font-medium">{section.title}</h3>
              {section.is_admin_managed ? (
                <Badge variant="secondary">Admin</Badge>
              ) : null}
              {section.is_admin_managed && section.is_editable === false ? (
                <Badge variant="outline">Somente leitura</Badge>
              ) : null}
              {section.is_admin_managed && section.is_editable ? (
                <Badge variant="outline">Editável</Badge>
              ) : null}
            </div>
            <div
              className="prose prose-sm max-w-none text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: section.content_html }}
            />
          </article>
        ))}
      </section>

      {proposal.pdf_file ? (
        <section className="space-y-3 rounded-xl border p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">PDF da minuta</h2>
            <a
              href={proposal.pdf_file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              Abrir em nova aba
            </a>
          </div>
          <iframe
            title="PDF da minuta"
            src={proposal.pdf_file.url}
            className="h-[480px] w-full rounded-md border"
          />
        </section>
      ) : null}
    </div>
  );
}

function PartySummary({
  party,
}: {
  party: ContractProposal["contractor"];
}) {
  return (
    <ul className="space-y-1 text-sm text-muted-foreground">
      <li className="text-foreground font-medium">{party.legal_name}</li>
      {party.trade_name ? <li>Fantasia: {party.trade_name}</li> : null}
      <li>CNPJ: {party.tax_id}</li>
      {party.legal_representative ? (
        <li>Representante: {party.legal_representative}</li>
      ) : null}
      {party.email ? <li>E-mail: {party.email}</li> : null}
      {party.phone ? <li>Telefone: {party.phone}</li> : null}
    </ul>
  );
}
