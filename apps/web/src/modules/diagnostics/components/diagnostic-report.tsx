"use client";

import { Badge } from "@econmesh-admin/ui/components/badge";
import { Button } from "@econmesh-admin/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@econmesh-admin/ui/components/card";
import { Skeleton } from "@econmesh-admin/ui/components/skeleton";
import { ArrowLeft, Printer } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ProgressIndicator } from "@/modules/diagnostics/components/progress-indicator";
import { formatCnpj, formatDateTime } from "@/modules/diagnostics/lib/rules";
import { diagnosticsService, type DiagnosticReport } from "@/services/dmc/diagnostics.service";
import { ApiError } from "@/utils/errors";

function points(value: number) {
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

/** Visualização do relatório a partir dos dados estruturados do backend. */
export function DiagnosticReportView({ diagnosticId }: { diagnosticId: string }) {
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void diagnosticsService
      .report(diagnosticId)
      .then(setReport)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Não foi possível gerar o relatório."),
      );
  }, [diagnosticId]);

  const back = (
    <Link
      href={`/dashboard/diagnosticos/${diagnosticId}` as Route}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground print:hidden"
    >
      <ArrowLeft className="size-4" aria-hidden />
      Voltar ao diagnóstico
    </Link>
  );

  if (error) {
    return (
      <div className="space-y-4">
        {back}
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      </div>
    );
  }
  if (!report) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const ems = report.ems;
  return (
    <article className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {back}
        <Button type="button" variant="outline" className="print:hidden" onClick={() => window.print()}>
          <Printer aria-hidden />
          Imprimir
        </Button>
      </div>

      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Relatório — Diagnóstico de Maturidade Circular
        </p>
        <h1 className="text-2xl font-semibold">{report.company.legal_name}</h1>
        <dl className="grid gap-x-6 gap-y-1 text-sm text-muted-foreground sm:grid-cols-2">
          <div>
            <dt className="inline">CNPJ: </dt>
            <dd className="inline text-foreground">{formatCnpj(report.company.tax_id)}</dd>
          </div>
          <div>
            <dt className="inline">Segmento: </dt>
            <dd className="inline text-foreground">{report.company.sector || "—"}</dd>
          </div>
          <div>
            <dt className="inline">Data do diagnóstico: </dt>
            <dd className="inline text-foreground">
              {formatDateTime(report.diagnostic.completed_at)}
            </dd>
          </div>
          <div>
            <dt className="inline">Agente DMC responsável: </dt>
            <dd className="inline text-foreground">{report.agent_name || "—"}</dd>
          </div>
        </dl>
      </header>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-base">Pontuação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {report.pillars.map((pillar) => (
              <div key={pillar.pillar_id} className="space-y-2 rounded-lg border p-4">
                <p className="text-xs font-medium text-muted-foreground">
                  {pillar.name}
                  {pillar.ems_weight != null ? ` · ${pillar.ems_weight}% do EMS` : ""}
                </p>
                <p className="text-2xl font-semibold">
                  {pillar.points}
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}
                    / {pillar.max_points} pts
                  </span>
                </p>
                <ProgressIndicator value={pillar.percent ?? 0} size="sm" label={pillar.code} />
              </div>
            ))}
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-xs font-medium text-muted-foreground">Pontuação geral (EMS parcial)</p>
            <p className="text-2xl font-semibold">
              {points(ems.points)}
              <span className="text-sm font-normal text-muted-foreground">
                {" "}
                / {points(ems.max_available)} pts possíveis nos eixos disponíveis
              </span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium">Nível de maturidade:</span>
            {report.maturity_level ? (
              <Badge>{report.maturity_level}</Badge>
            ) : (
              <span className="text-muted-foreground">
                será apresentado quando a régua de maturidade e os demais eixos forem
                disponibilizados.
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {report.steps
        .filter((step) => step.availability === "available")
        .map((step) => (
          <Card key={step.id} className="rounded-xl break-inside-avoid">
            <CardHeader>
              <CardTitle className="text-base">{step.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {step.sections.map((section) => (
                <section key={section.id} className="space-y-2">
                  <h3 className="text-sm font-semibold">{section.title}</h3>
                  <dl className="divide-y rounded-lg border">
                    {section.answers.map((answer) => (
                      <div
                        key={answer.question_id}
                        className="grid gap-1 px-3 py-2.5 text-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:gap-4"
                      >
                        <dt className="text-muted-foreground">
                          {answer.code ? `${answer.code} ` : ""}
                          {answer.label}
                        </dt>
                        <dd className="flex flex-wrap items-center gap-2">
                          <span>{answer.display_value ?? "—"}</span>
                          {answer.scored && answer.points != null ? (
                            <Badge variant="secondary">
                              {answer.points}/{answer.max_points} pts
                            </Badge>
                          ) : null}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
            </CardContent>
          </Card>
        ))}

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-base">Análise e recomendações</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Resumo executivo, principais pontos observados, oportunidades de melhoria e
          recomendações serão incluídos nas próximas versões do relatório. Todas as respostas e
          indicadores deste diagnóstico já estão armazenados para isso.
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Gerado em {formatDateTime(report.generated_at)} · versão do questionário{" "}
        {report.catalog_version}
      </p>
    </article>
  );
}
