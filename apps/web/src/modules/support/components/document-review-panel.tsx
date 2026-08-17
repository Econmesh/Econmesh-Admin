"use client";

import { Badge } from "@econmesh-admin/ui/components/badge";
import { Button } from "@econmesh-admin/ui/components/button";
import { Textarea } from "@econmesh-admin/ui/components/textarea";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CompanyInfoDialog } from "@/modules/companies/components/company-info-dialog";
import { DocumentStatusBadge } from "@/modules/companies/components/document-status-badge";
import {
  COMPLIANCE_ACCEPT,
  MAX_COMPLIANCE_BYTES,
  formatCnpj,
  isAllowedComplianceFile,
} from "@/modules/companies/schemas";
import { adminCompaniesService } from "@/services/admin/companies.service";
import type { Company, CompanyComplianceFile, CompanyDocumentKind } from "@/types/api";
import { ApiError } from "@/utils/errors";

type DocumentKind = CompanyDocumentKind;
type DocumentField = "operating_license" | "mtr_document" | "signature_authorization";

const DOCUMENTS: { kind: DocumentKind; label: string; field: DocumentField }[] = [
  { kind: "operating_license", label: "Licença de operação", field: "operating_license" },
  { kind: "mtr", label: "MTR", field: "mtr_document" },
  {
    kind: "signature_authorization",
    label: "Autorização de assinatura",
    field: "signature_authorization",
  },
];

type Props = {
  companyId: string;
  onReviewed?: (company: Company) => void;
};

function isImage(file: CompanyComplianceFile): boolean {
  return file.content_type.startsWith("image/");
}

function isPdf(file: CompanyComplianceFile): boolean {
  return file.content_type.includes("pdf") || file.filename.toLowerCase().endsWith(".pdf");
}

function DocumentPreview({ file }: { file: CompanyComplianceFile }) {
  if (isPdf(file)) {
    return (
      <iframe
        title={file.filename}
        src={file.public_url}
        className="h-80 w-full rounded-lg border border-border bg-muted"
      />
    );
  }
  if (isImage(file)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={file.public_url}
        alt={file.filename}
        className="max-h-80 w-full rounded-lg border border-border object-contain bg-muted"
      />
    );
  }
  return (
    <p className="text-sm text-muted-foreground">
      Preview indisponível.{" "}
      <a
        href={file.public_url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-primary hover:underline"
      >
        Abrir em nova aba
      </a>
    </p>
  );
}

function ReviewCard({
  companyId,
  kind,
  label,
  file,
  onReviewed,
}: {
  companyId: string;
  kind: DocumentKind;
  label: string;
  file?: CompanyComplianceFile | null;
  onReviewed?: (company: Company) => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const pending = file?.status === "pending" || (!file?.status && !!file);

  async function approve() {
    setBusy(true);
    try {
      const company = await adminCompaniesService.approveDocument(companyId, kind);
      toast.success(`${label} aprovado.`);
      onReviewed?.(company);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Não foi possível aprovar o documento.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    if (reason.trim().length < 3) {
      toast.error("Informe o motivo da rejeição.");
      return;
    }
    setBusy(true);
    try {
      const company = await adminCompaniesService.rejectDocument(
        companyId,
        kind,
        reason.trim(),
      );
      toast.success(`${label} rejeitado.`);
      setRejecting(false);
      setReason("");
      onReviewed?.(company);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Não foi possível rejeitar o documento.",
      );
    } finally {
      setBusy(false);
    }
  }

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
      const company = await adminCompaniesService.uploadDocument(
        companyId,
        kind,
        selectedFile,
        { approve: false },
      );
      toast.success(`${label} anexado e marcado como pendente.`);
      setSelectedFile(null);
      onReviewed?.(company);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Não foi possível anexar o documento.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!file) {
    return (
      <div className="space-y-3 rounded-xl border border-dashed border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">{label}</p>
          <DocumentStatusBadge status="pending" />
        </div>
        <p className="text-sm text-muted-foreground">Não enviado. Anexe o documento para análise.</p>
        <input
          type="file"
          accept={COMPLIANCE_ACCEPT}
          className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5"
          onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
        />
        <Button type="button" size="sm" disabled={busy || !selectedFile} onClick={() => void attach()}>
          {busy ? "Anexando..." : "Anexar"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{label}</p>
          <a
            href={file.public_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline"
          >
            {file.filename}
          </a>
        </div>
        <DocumentStatusBadge file={file} />
      </div>
      <DocumentPreview file={file} />
      {file.status === "rejected" && file.rejection_reason ? (
        <p className="text-sm text-destructive">Motivo: {file.rejection_reason}</p>
      ) : null}
      {pending ? (
        rejecting ? (
          <div className="space-y-2">
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Informe o motivo da rejeição"
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={busy || reason.trim().length < 3}
                onClick={() => void reject()}
              >
                {busy ? "Enviando..." : "Confirmar rejeição"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => {
                  setRejecting(false);
                  setReason("");
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button type="button" size="sm" disabled={busy} onClick={() => void approve()}>
              {busy ? "Aprovando..." : "Aprovar"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={busy}
              onClick={() => setRejecting(true)}
            >
              Rejeitar
            </Button>
          </div>
        )
      ) : null}
    </div>
  );
}

export function DocumentReviewPanel({ companyId, onReviewed }: Props) {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCompanyInfo, setShowCompanyInfo] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void adminCompaniesService
      .get(companyId)
      .then((data) => {
        if (!cancelled) setCompany(data);
      })
      .catch((error) => {
        if (!cancelled) {
          toast.error(
            error instanceof ApiError
              ? error.message
              : "Não foi possível carregar os documentos.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  function handleReviewed(updated: Company) {
    setCompany(updated);
    onReviewed?.(updated);
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando documentos...</p>;
  }

  if (!company) return null;

  return (
    <div className="space-y-4 rounded-xl border border-violet-200 bg-violet-50/60 p-4 dark:border-violet-800 dark:bg-violet-950/30">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="border-transparent bg-violet-500/15 text-violet-700 dark:text-violet-400">
          Documentos
        </Badge>
        <div>
          <button
            type="button"
            className="font-medium text-left text-primary underline-offset-4 hover:underline"
            onClick={() => setShowCompanyInfo(true)}
          >
            {company.legal_name}
          </button>
          <p className="text-xs text-muted-foreground">CNPJ {formatCnpj(company.tax_id)}</p>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {DOCUMENTS.map((item) => (
          <ReviewCard
            key={item.kind}
            companyId={company.id}
            kind={item.kind}
            label={item.label}
            file={company[item.field]}
            onReviewed={handleReviewed}
          />
        ))}
      </div>
      <CompanyInfoDialog
        company={company}
        open={showCompanyInfo}
        onOpenChange={setShowCompanyInfo}
      />
    </div>
  );
}
