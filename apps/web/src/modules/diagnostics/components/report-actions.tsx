"use client";

import { Button } from "@econmesh-admin/ui/components/button";
import { Card, CardContent } from "@econmesh-admin/ui/components/card";
import { CheckCircle2, Eye, FileDown, FileText, Loader2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { useReportPdf } from "@/modules/diagnostics/hooks/use-report-pdf";
import { formatDateTime } from "@/modules/diagnostics/lib/rules";
import { diagnosticsService, type DiagnosticDetail } from "@/services/dmc/diagnostics.service";
import { ApiError } from "@/utils/errors";

/**
 * Fluxo: diagnóstico concluído → Gerar relatório → Visualizar (revisão) → Gerar PDF.
 * O relatório é gerado uma vez e persistido; depois é só reabrir.
 */
export function ReportActions({ detail }: { detail: DiagnosticDetail }) {
  const [generatedAt, setGeneratedAt] = useState<string | null>(
    detail.report_generated_at ?? null,
  );
  const [generating, setGenerating] = useState(false);
  const pdf = useReportPdf(detail.id, detail.company.trade_name ?? detail.company.legal_name);
  const reportHref = `/dashboard/diagnosticos/${detail.id}/relatorio` as Route;

  async function generate() {
    setGenerating(true);
    try {
      const report = await diagnosticsService.generateReport(detail.id);
      setGeneratedAt(report.generated_at);
      toast.success("Relatório gerado.");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Não foi possível gerar o relatório.",
      );
    } finally {
      setGenerating(false);
    }
  }

  if (!generatedAt) {
    return (
      <Card className="rounded-xl border-primary/30">
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground" role="status">
            {generating
              ? "Gerando relatório..."
              : "Gere o relatório a partir das respostas e pontuações registradas."}
          </p>
          <Button size="lg" disabled={generating} onClick={() => void generate()}>
            {generating ? <Loader2 className="animate-spin" aria-hidden /> : <FileText aria-hidden />}
            {generating ? "Gerando relatório..." : "Gerar relatório"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl border-emerald-500/40">
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden />
          <div>
            <p className="font-semibold">Relatório de Diagnóstico de Maturidade Circular</p>
            <p className="text-sm text-muted-foreground">
              Gerado em {formatDateTime(generatedAt)}. Revise o relatório antes de gerar o PDF.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href={reportHref} className="inline-flex">
            <Button size="lg" className="w-full">
              <Eye aria-hidden />
              Visualizar relatório
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            disabled={pdf.generating}
            onClick={() => void pdf.download()}
          >
            {pdf.generating ? <Loader2 className="animate-spin" aria-hidden /> : <FileDown aria-hidden />}
            {pdf.generating ? "Gerando relatório PDF..." : "Gerar PDF"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
