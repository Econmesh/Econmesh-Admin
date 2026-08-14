"use client";

import { Button } from "@econmesh-admin/ui/components/button";
import { Building2, X } from "lucide-react";
import Image from "next/image";
import { useEffect } from "react";

import { formatCep, formatCnpj, formatPhone } from "@/modules/companies/schemas";
import type { Company } from "@/types/api";

type CompanyInfoDialogProps = {
  company: Company;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function DetailItem({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value}</dd>
    </div>
  );
}

export function CompanyInfoDialog({
  company,
  open,
  onOpenChange,
}: CompanyInfoDialogProps) {
  const address = company.address;

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="company-info-title"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
              {company.logo_url ? (
                <Image
                  src={company.logo_url}
                  alt={`Logo de ${company.legal_name}`}
                  fill
                  className="object-contain p-1"
                  unoptimized
                />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <Building2 className="size-5 text-muted-foreground" aria-hidden />
                </div>
              )}
            </div>
            <div>
              <h2 id="company-info-title" className="text-lg font-semibold">
                {company.legal_name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {company.trade_name || "Sem nome fantasia"}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Fechar"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" aria-hidden />
          </Button>
        </div>

        <div className="mt-6 space-y-6">
          <section>
            <h3 className="mb-3 text-sm font-medium">Dados básicos</h3>
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem label="CNPJ" value={formatCnpj(company.tax_id)} />
              <DetailItem label="E-mail" value={company.email} />
              <DetailItem
                label="Telefone"
                value={company.phone ? formatPhone(company.phone) : null}
              />
              <DetailItem label="Representante legal" value={company.legal_representative} />
              <DetailItem label="Setor" value={company.sector} />
              <DetailItem label="País" value={company.country} />
            </dl>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-medium">Endereço</h3>
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem
                label="CEP"
                value={address?.postal_code ? formatCep(address.postal_code) : null}
              />
              <DetailItem label="Rua" value={address?.street} />
              <DetailItem label="Número" value={address?.number} />
              <DetailItem label="Complemento" value={address?.complement} />
              <DetailItem label="Bairro" value={address?.neighborhood} />
              <DetailItem label="Cidade" value={address?.city} />
              <DetailItem label="Estado" value={address?.state} />
            </dl>
          </section>

          {company.website || company.description ? (
            <section>
              <h3 className="mb-3 text-sm font-medium">Informações adicionais</h3>
              <div className="space-y-4">
                {company.website ? (
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">Site</dt>
                    <dd className="mt-1 text-sm">
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {company.website}
                      </a>
                    </dd>
                  </div>
                ) : null}
                <DetailItem label="Descrição" value={company.description} />
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
