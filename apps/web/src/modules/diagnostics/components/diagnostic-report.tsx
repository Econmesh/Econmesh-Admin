"use client";

import { Button } from "@econmesh-admin/ui/components/button";
import { Skeleton } from "@econmesh-admin/ui/components/skeleton";
import { ArrowLeft, FileDown, FileText, Loader2, RefreshCw } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { EmptyState } from "@/components/feedback/empty-state";
import { AlertList } from "@/modules/diagnostics/components/alert-list";
import { useReportPdf } from "@/modules/diagnostics/hooks/use-report-pdf";
import { REPORT_CSS_VARS } from "@/modules/diagnostics/lib/report-brand";
import {
  AnalysisSection,
  AnswersSection,
  AttentionPointsSection,
  CompanySection,
  ConclusionSection,
  ExecutiveSummary,
  IndicatorsSection,
  ItemsSection,
  MethodologySection,
  OpportunitiesSection,
  OverviewSection,
  PillarsSection,
  ReportFooter,
  ReportHeader,
  ReportSection,
  ScopeSection,
  StrengthsSection,
} from "@/modules/diagnostics/report/report-sections";
import { diagnosticsService, type MaturityReport } from "@/services/dmc/diagnostics.service";
import { ApiError } from "@/utils/errors";

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "not_generated" }
  | { kind: "insufficient" }
  | { kind: "generating" }
  | { kind: "ready"; report: MaturityReport };

/** Ordem dinâmica: a mesma estrutura do PDF. */
const SECTIONS = [
  ["executivo", "Resumo Executivo"],
  ["visao-geral", "Visão Geral da Maturidade"],
  ["produtos-residuos", "Produtos e Resíduos"],
  ["pilares", "Resultados por Pilar"],
  ["indicadores", "Indicadores Avaliados"],
  ["destaques", "Pontos de Destaque"],
  ["atencao", "Pontos de Atenção"],
  ["oportunidades", "Oportunidades de Melhoria"],
  ["analise", "Análise do Diagnóstico"],
  ["conclusao", "Conclusão do Diagnóstico"],
  ["escopo", "Escopo e Limitações"],
  ["metodologia", "Metodologia"],
  ["empresa", "Identificação da Empresa"],
  ["respostas", "Respostas do Diagnóstico"],
] as const;

export function DiagnosticReportView({ diagnosticId }: { diagnosticId: string }) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const report = state.kind === "ready" ? state.report : null;
  const pdf = useReportPdf(diagnosticId, report?.company.trade_name ?? report?.company.legal_name);

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      setState({ kind: "ready", report: await diagnosticsService.report(diagnosticId) });
    } catch (error) {
      if (error instanceof ApiError && error.code === "report_not_generated") {
        setState({ kind: "not_generated" });
      } else if (error instanceof ApiError && error.code === "diagnostic_not_completed") {
        setState({ kind: "insufficient" });
      } else {
        setState({ kind: "error", message: "Não foi possível carregar o relatório. Tente novamente." });
      }
    }
  }, [diagnosticId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function generate() {
    setState({ kind: "generating" });
    try {
      setState({ kind: "ready", report: await diagnosticsService.generateReport(diagnosticId) });
    } catch (error) {
      if (error instanceof ApiError && error.code === "diagnostic_not_completed") {
        setState({ kind: "insufficient" });
      } else {
        setState({ kind: "error", message: "Não foi possível gerar o relatório. Tente novamente." });
      }
    }
  }

  const back = (
    <Link
      href={`/dashboard/diagnosticos/${diagnosticId}` as Route}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" aria-hidden />
      Voltar ao diagnóstico
    </Link>
  );

  if (state.kind === "loading" || state.kind === "generating") {
    return (
      <div className="space-y-4" aria-busy="true">
        {back}
        <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {state.kind === "generating" ? "Gerando relatório..." : "Preparando diagnóstico..."}
        </p>
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="space-y-4">
        {back}
        <EmptyState
          icon={FileText}
          title={state.message}
          action={
            <Button variant="outline" onClick={() => void load()}>
              <RefreshCw aria-hidden />
              Tentar novamente
            </Button>
          }
        />
      </div>
    );
  }

  if (state.kind === "insufficient") {
    return (
      <div className="space-y-4">
        {back}
        <EmptyState
          icon={FileText}
          title="Ainda não existem dados suficientes para gerar este relatório."
          description="O relatório fica disponível depois que o diagnóstico é concluído."
        />
      </div>
    );
  }

  if (state.kind === "not_generated") {
    return (
      <div className="space-y-4">
        {back}
        <EmptyState
          icon={FileText}
          title="Relatório ainda não gerado"
          description="Gere o relatório a partir das respostas e pontuações registradas no diagnóstico."
          action={
            <Button onClick={() => void generate()}>
              <FileText aria-hidden />
              Gerar relatório
            </Button>
          }
        />
      </div>
    );
  }

  const r = state.report;
  let n = 0;
  const next = () => ++n;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {back}
        <Button size="lg" disabled={pdf.generating} onClick={() => void pdf.download()}>
          {pdf.generating ? <Loader2 className="animate-spin" aria-hidden /> : <FileDown aria-hidden />}
          {pdf.generating ? "Gerando relatório PDF..." : "Gerar PDF"}
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Seções do relatório" className="hidden xl:block">
          <ol className="sticky top-20 space-y-1 text-sm">
            {SECTIONS.map(([id, title], index) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="block rounded-md px-2 py-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  {index + 1}. {title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article
          style={REPORT_CSS_VARS}
          className="min-w-0 overflow-hidden rounded-xl border bg-white text-[var(--rb-ink)] shadow-sm [color-scheme:light]"
        >
          <ReportHeader report={r} />
          <div className="space-y-10 px-5 pb-10 sm:px-10">
            <AlertList alerts={r.alerts} title="Alertas de risco" />
            <ReportSection id="executivo" number={next()} title="Resumo Executivo">
              <ExecutiveSummary report={r} />
            </ReportSection>
            <ReportSection id="visao-geral" number={next()} title="Visão Geral da Maturidade Circular">
              <OverviewSection report={r} />
            </ReportSection>
            <ReportSection id="produtos-residuos" number={next()} title="Produtos e Resíduos">
              <ItemsSection report={r} />
            </ReportSection>
            <ReportSection id="pilares" number={next()} title="Resultados por Pilar">
              <PillarsSection report={r} />
            </ReportSection>
            <ReportSection id="indicadores" number={next()} title="Indicadores Avaliados">
              <IndicatorsSection report={r} />
            </ReportSection>
            <ReportSection id="destaques" number={next()} title="Pontos de Destaque">
              <StrengthsSection items={r.strengths} />
            </ReportSection>
            <ReportSection id="atencao" number={next()} title="Pontos de Atenção">
              <AttentionPointsSection items={r.attention_points} />
            </ReportSection>
            <ReportSection id="oportunidades" number={next()} title="Oportunidades de Melhoria">
              <OpportunitiesSection items={r.opportunities} />
            </ReportSection>
            <ReportSection id="analise" number={next()} title="Análise do Diagnóstico">
              <AnalysisSection report={r} />
            </ReportSection>
            <ReportSection id="conclusao" number={next()} title="Conclusão do Diagnóstico">
              <ConclusionSection paragraphs={r.conclusions} />
            </ReportSection>
            <ReportSection id="escopo" number={next()} title="Escopo e Limitações">
              <ScopeSection report={r} />
            </ReportSection>
            <ReportSection id="metodologia" number={next()} title="Metodologia">
              <MethodologySection report={r} />
            </ReportSection>
            <ReportSection id="empresa" number={next()} title="Identificação da Empresa">
              <CompanySection report={r} />
            </ReportSection>
            <ReportSection id="respostas" number={next()} title="Respostas do Diagnóstico">
              <AnswersSection report={r} />
            </ReportSection>
          </div>
          <ReportFooter report={r} />
        </article>
      </div>
    </div>
  );
}
