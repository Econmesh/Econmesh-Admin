"use client";

import { Button } from "@econmesh-admin/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@econmesh-admin/ui/components/card";
import { Building2, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { DeleteCompanyDialog } from "@/modules/companies/components/delete-company-dialog";
import { DocumentStatusBadge } from "@/modules/companies/components/document-status-badge";
import {
  COMPLIANCE_ACCEPT,
  MAX_COMPLIANCE_BYTES,
  formatCep,
  formatCnpj,
  formatPhone,
  isAllowedComplianceFile,
} from "@/modules/companies/schemas";
import { adminCompaniesService } from "@/services/admin/companies.service";
import type { Company, CompanyComplianceFile, CompanyDocumentKind } from "@/types/api";
import { ApiError } from "@/utils/errors";

type CompanyDetailViewProps = {
  company: Company;
  onDeleted: () => void;
  onUpdated?: (company: Company) => void;
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

function DocumentItem({
  companyId,
  kind,
  label,
  file,
  onUpdated,
}: {
  companyId: string;
  kind: CompanyDocumentKind;
  label: string;
  file?: CompanyComplianceFile | null;
  onUpdated?: (company: Company) => void;
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function attach() {
    if (!selectedFile) {
      toast.error("Selecione um arquivo para anexar.");
      return;
    }
    if (!isAllowedComplianceFile(selectedFile)) {
      toast.error("Use PDF, JPEG ou PNG.");
      return;
    }
    if (selectedFile.size > MAX_COMPLIANCE_BYTES) {
      toast.error("Arquivo deve ter no máximo 10 MB.");
      return;
    }
    setBusy(true);
    try {
      const updated = await adminCompaniesService.uploadDocument(
        companyId,
        kind,
        selectedFile,
        { approve: false },
      );
      toast.success(`${label} anexado e marcado como pendente.`);
      setSelectedFile(null);
      onUpdated?.(updated);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Não foi possível anexar o documento.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 space-y-2 text-sm">
        {file ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={file.public_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                {file.filename}
              </a>
              <DocumentStatusBadge file={file} />
            </div>
            {file.status === "rejected" && file.rejection_reason ? (
              <p className="text-xs text-destructive">Motivo: {file.rejection_reason}</p>
            ) : null}
          </>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground">Não enviado</span>
              <DocumentStatusBadge status="pending" />
            </div>
            <input
              type="file"
              accept={COMPLIANCE_ACCEPT}
              className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            />
            <Button
              type="button"
              size="sm"
              disabled={busy || !selectedFile}
              onClick={() => void attach()}
            >
              {busy ? "Anexando..." : "Anexar"}
            </Button>
          </div>
        )}
      </dd>
    </div>
  );
}

export function CompanyDetailView({ company, onDeleted, onUpdated }: CompanyDetailViewProps) {
  const [showDelete, setShowDelete] = useState(false);
  const address = company.address;

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="relative size-16 overflow-hidden rounded-xl border border-border bg-muted">
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
                  <Building2 className="size-6 text-muted-foreground" aria-hidden />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-semibold">{company.legal_name}</h1>
              <p className="text-muted-foreground">
                {company.trade_name || "Sem nome fantasia"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href={`/dashboard/empresas/${company.id}/editar`} className="inline-flex">
              <Button variant="outline">
                <Pencil className="size-4" aria-hidden />
                Editar
              </Button>
            </Link>
            <Button variant="destructive" onClick={() => setShowDelete(true)}>
              <Trash2 className="size-4" aria-hidden />
              Excluir
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>Dados básicos</CardTitle>
              <CardDescription>Informações principais da empresa.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailItem label="CNPJ" value={formatCnpj(company.tax_id)} />
                <DetailItem label="E-mail" value={company.email} />
                <DetailItem label="Telefone" value={company.phone ? formatPhone(company.phone) : null} />
                <DetailItem label="Setor" value={company.sector} />
                <DetailItem label="País" value={company.country} />
              </dl>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
              <CardDescription>Localização da sede.</CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          <Card className="rounded-xl lg:col-span-2">
            <CardHeader>
              <CardTitle>Documentos</CardTitle>
              <CardDescription>
                Licença de operação, comprovante MTR e autorização de assinatura.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <DocumentItem
                  companyId={company.id}
                  kind="operating_license"
                  label="Licença de operação"
                  file={company.operating_license}
                  onUpdated={onUpdated}
                />
                <DocumentItem
                  companyId={company.id}
                  kind="mtr"
                  label="MTR"
                  file={company.mtr_document}
                  onUpdated={onUpdated}
                />
                <DocumentItem
                  companyId={company.id}
                  kind="signature_authorization"
                  label="Autorização de assinatura"
                  file={company.signature_authorization}
                  onUpdated={onUpdated}
                />
              </dl>
            </CardContent>
          </Card>

          <Card className="rounded-xl lg:col-span-2">
            <CardHeader>
              <CardTitle>Informações adicionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>
        </div>
      </div>

      <DeleteCompanyDialog
        company={company}
        open={showDelete}
        onOpenChange={setShowDelete}
        onDeleted={onDeleted}
      />
    </>
  );
}
