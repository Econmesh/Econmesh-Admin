"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Database,
  Lightbulb,
  PencilLine,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import { MaturityChart, PillarChart } from "@/modules/diagnostics/report/report-charts";
import { formatNumber } from "@/modules/diagnostics/lib/report-brand";
import { formatCnpj, formatDateTime } from "@/modules/diagnostics/lib/rules";
import type {
  MaturityReport,
  ReportAxis,
  ReportFinding,
  ReportIndicator,
  ReportOpportunity,
  ReportPillar,
} from "@/services/dmc/diagnostics.service";

function formatDate(value: string | null | undefined) {
  return value ? formatDateTime(value).slice(0, 10) : "—";
}

/* ------------------------------------------------------------------ base */
export function ReportSection({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24 space-y-4">
      <h2
        id={`${id}-title`}
        className="border-b-2 border-[var(--rb-leaf)] pb-2 text-lg font-semibold text-[var(--rb-green)] sm:text-xl"
      >
        <span className="mr-2 text-[var(--rb-muted)]">{number}.</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-lg border-l-4 border-[var(--rb-leaf)] bg-[var(--rb-surface)] p-4 ${className}`}
    >
      {children}
    </div>
  );
}

export function ProgressBar({ value, label }: { value: number | null; label: string }) {
  const percent = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
      className="h-2 w-full overflow-hidden rounded-full bg-[var(--rb-track)]"
    >
      <div className="h-full rounded-full bg-[var(--rb-green)]" style={{ width: `${percent}%` }} />
    </div>
  );
}

/* --------------------------------------------------------------- cabeçalho */
export function ReportHeader({ report }: { report: MaturityReport }) {
  const items = [
    ["Empresa", report.company.legal_name],
    ["CNPJ", formatCnpj(report.company.tax_id)],
    ["Segmento", report.company.sector || "—"],
    ["Responsável", report.contact.name || "—"],
    ["Agente DMC", report.agent.name || report.agent.email || "—"],
    ["Data do diagnóstico", formatDate(report.diagnostic.completed_at)],
    ["Status", report.diagnostic.status === "completed" ? "Concluído" : report.diagnostic.status],
  ];
  return (
    <header className="overflow-hidden rounded-t-xl">
      <div className="h-2 bg-[var(--rb-green)]" />
      <div className="flex flex-col gap-6 px-5 py-6 sm:px-10 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Image
            src="/ECONMESH-LOGO.png"
            alt="ECONMESH"
            width={200}
            height={50}
            className="h-10 w-auto sm:h-12"
            priority
          />
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--rb-muted)]">
            Relatório diagnóstico
          </p>
        </div>
        <div>
          <h1 className="text-2xl font-bold leading-tight text-[var(--rb-green)] sm:text-3xl">
            Diagnóstico de Maturidade Circular
          </h1>
          <p className="mt-1 text-base font-semibold sm:text-lg">{report.company.legal_name}</p>
        </div>
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {items.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs uppercase tracking-wide text-[var(--rb-muted)]">{label}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </header>
  );
}

/* -------------------------------------------------------- resumo executivo */
export function ScoreCard({
  label,
  value,
  caption,
  muted,
}: {
  label: string;
  value: string;
  caption: string;
  muted?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[var(--rb-border)] bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--rb-muted)]">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold ${muted ? "text-[var(--rb-muted)]" : "text-[var(--rb-green)]"}`}
      >
        {value}
      </p>
      <p
        className={`text-xs ${muted ? "font-medium text-[var(--rb-warning)]" : "text-[var(--rb-muted)]"}`}
      >
        {caption}
      </p>
    </div>
  );
}

export function ExecutiveSummary({ report }: { report: MaturityReport }) {
  const { summary } = report;
  const level = summary.maturity_level;
  return (
    <div className="space-y-5">
      <div className="grid gap-5 rounded-xl bg-[var(--rb-surface)] p-5 sm:grid-cols-[auto_1fr] sm:items-center sm:p-6">
        <ScoreRing percent={summary.overall_percent} score={summary.overall_score} max={summary.overall_max} />
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--rb-muted)]">
            Maturidade circular — score geral (EMS)
          </p>
          <p className="text-lg font-semibold">{summary.headline}</p>
          {level ? (
            <p>
              <span className="font-semibold">
                Nível {level.level} — {level.name}
              </span>
              <br />
              <span className="text-sm text-[var(--rb-muted)]">{level.description}</span>
            </p>
          ) : (
            <p className="text-sm">
              <span className="font-semibold">Nível: não classificado</span>
              <br />
              <span className="text-[var(--rb-muted)]">
                {summary.maturity_scale_defined
                  ? "A classificação é aplicada apenas com todos os eixos avaliados."
                  : "A régua oficial de maturidade ainda não está cadastrada."}
              </span>
            </p>
          )}
          {summary.partial ? (
            <p className="flex items-center gap-1.5 text-sm font-medium text-[var(--rb-warning)]">
              <AlertTriangle className="size-4" aria-hidden />
              Score parcial: nem todos os eixos foram avaliados.
            </p>
          ) : null}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <ScoreCard
          label="Score geral"
          value={formatNumber(summary.overall_score, 2)}
          caption={`de ${formatNumber(summary.overall_max, 2)}`}
        />
        {report.axes.map((axis) => (
          <AxisScoreCard key={axis.step_id} axis={axis} />
        ))}
      </div>
      {report.conclusions.slice(0, 2).map((paragraph) => (
        <p key={paragraph} className="leading-relaxed">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

function ScoreRing({ percent, score, max }: { percent: number | null; score: number; max: number }) {
  const value = Math.max(0, Math.min(100, percent ?? 0));
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative mx-auto size-36" role="img" aria-label={`Score geral ${formatNumber(score, 2)} de ${formatNumber(max, 2)}`}>
      <svg viewBox="0 0 128 128" className="size-full -rotate-90" aria-hidden>
        <circle cx="64" cy="64" r={radius} fill="none" stroke="var(--rb-track)" strokeWidth="12" />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="var(--rb-green)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${(circumference * value) / 100} ${circumference}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-[var(--rb-green)]">{formatNumber(score, 2)}</span>
        <span className="text-xs text-[var(--rb-muted)]">de {formatNumber(max, 2)} pontos</span>
      </div>
    </div>
  );
}

export function AxisScoreCard({ axis }: { axis: ReportAxis }) {
  if (axis.status !== "evaluated") {
    return <ScoreCard label={axis.short_title} value="—" caption="Em manutenção" muted />;
  }
  return (
    <ScoreCard label={axis.short_title} value={`${formatNumber(axis.percent)}%`} caption="do eixo" />
  );
}

/* ---------------------------------------------------------- visão geral */
export function OverviewSection({ report }: { report: MaturityReport }) {
  return (
    <div className="space-y-5">
      <MaturityChart axes={report.axes} />
      <div className="grid gap-3 md:grid-cols-2">
        {report.axes.map((axis) => (
          <div key={axis.step_id} className="rounded-lg border border-[var(--rb-border)] bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold">{axis.title}</p>
              {axis.status === "evaluated" ? (
                <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[var(--rb-green)]">
                  <CheckCircle2 className="size-3.5" aria-hidden />
                  Avaliado
                </span>
              ) : (
                <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[var(--rb-warning)]">
                  <Wrench className="size-3.5" aria-hidden />
                  Em manutenção
                </span>
              )}
            </div>
            {axis.status === "evaluated" ? (
              <div className="mt-3 space-y-1.5">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-[var(--rb-muted)]">
                    {formatNumber(axis.ems_points)} de {formatNumber(axis.ems_max)} pts no EMS
                  </span>
                  <span className="text-lg font-bold text-[var(--rb-green)]">
                    {formatNumber(axis.percent)}%
                  </span>
                </div>
                <ProgressBar value={axis.percent} label={`${axis.title}: resultado`} />
                <p className="text-xs text-[var(--rb-muted)]">
                  {axis.scored_questions} indicadores pontuados · {axis.reading}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-[var(--rb-muted)]">
                Eixo não avaliado neste diagnóstico. Será incorporado ao resultado quando estiver
                disponível.
              </p>
            )}
          </div>
        ))}
      </div>
      {!report.scope.complete ? (
        <Panel className="text-sm">{report.scope.text}</Panel>
      ) : null}
    </div>
  );
}

/* --------------------------------------------------------------- pilares */
export function PillarScoreCard({ pillar }: { pillar: ReportPillar }) {
  return (
    <div className="space-y-2 rounded-lg border border-[var(--rb-border)] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{pillar.name}</p>
          {pillar.ems_weight != null ? (
            <p className="text-xs text-[var(--rb-muted)]">
              Peso no modelo: {formatNumber(pillar.ems_weight)}%
            </p>
          ) : null}
        </div>
        <p className="shrink-0 text-right">
          <span className="text-2xl font-bold text-[var(--rb-green)]">{pillar.points}</span>
          <span className="text-sm text-[var(--rb-muted)]"> / {pillar.max_points}</span>
        </p>
      </div>
      <ProgressBar value={pillar.percent} label={`${pillar.name}: pontuação`} />
      <p className="text-xs text-[var(--rb-muted)]">
        {formatNumber(pillar.percent)}% do máximo do pilar · contribuição de{" "}
        {formatNumber(pillar.ems_points, 2)} de {formatNumber(pillar.ems_max, 2)} pts no EMS ·{" "}
        {pillar.answered} de {pillar.total} indicadores respondidos
      </p>
    </div>
  );
}

export function PillarsSection({ report }: { report: MaturityReport }) {
  return (
    <div className="space-y-5">
      <PillarChart pillars={report.pillars} />
      <div className="grid gap-3 md:grid-cols-2">
        {report.pillars.map((pillar) => (
          <PillarScoreCard key={pillar.pillar_id} pillar={pillar} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ indicadores */
const TIER = {
  high: { label: "Destaque", className: "text-[var(--rb-green)]" },
  medium: { label: "Atenção moderada", className: "text-[var(--rb-warning)]" },
  low: { label: "Atenção", className: "text-[var(--rb-critical)]" },
  unanswered: { label: "Não respondida", className: "text-[var(--rb-muted)]" },
} as const;

export function IndicatorCard({ indicator }: { indicator: ReportIndicator }) {
  const tier = TIER[indicator.tier];
  return (
    <article className="space-y-2 rounded-lg border border-[var(--rb-border)] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">
            {indicator.code ? (
              <span className="mr-1.5 text-xs text-[var(--rb-muted)]">{indicator.code}</span>
            ) : null}
            {indicator.title}
          </p>
          <p className="text-xs text-[var(--rb-muted)]">{indicator.label}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-bold">
            {indicator.points ?? "—"}
            <span className="text-sm font-normal text-[var(--rb-muted)]">/{indicator.max_points}</span>
          </p>
          <p className={`text-xs font-semibold ${tier.className}`}>{tier.label}</p>
        </div>
      </div>
      <ProgressBar value={indicator.percent} label={`${indicator.title}: pontuação`} />
      <p className="text-sm">
        <span className="text-[var(--rb-muted)]">Resposta: </span>
        <span className="font-semibold">{indicator.answer ?? "Não respondida"}</span>
      </p>
      {indicator.interpretation ? <p className="text-sm">{indicator.interpretation}</p> : null}
      <p className="text-xs text-[var(--rb-muted)]">
        Peso no pilar: {formatNumber(indicator.pillar_weight)}% · Peso no EMS:{" "}
        {formatNumber(indicator.ems_weight, 2)}%
      </p>
    </article>
  );
}

export function IndicatorsSection({ report }: { report: MaturityReport }) {
  return (
    <div className="space-y-6">
      {report.pillars.map((pillar) => {
        const items = report.indicators.filter((i) => i.pillar_id === pillar.pillar_id);
        if (items.length === 0) return null;
        return (
          <div key={pillar.pillar_id} className="space-y-3">
            <h3 className="font-semibold">{pillar.name}</h3>
            <div className="grid gap-3 lg:grid-cols-2">
              {items.map((indicator) => (
                <IndicatorCard key={indicator.question_id} indicator={indicator} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------- destaques / atenção / oport. */
export function StrengthsSection({ items }: { items: ReportFinding[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-[var(--rb-muted)]">Nenhum indicador atingiu a faixa de destaque.</p>;
  }
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {items.map((item) => (
        <li key={item.title} className="flex gap-3 rounded-lg border border-[var(--rb-border)] bg-white p-4">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[var(--rb-green)]" aria-hidden />
          <div>
            <p className="font-semibold">{item.title}</p>
            <p className="text-sm text-[var(--rb-muted)]">{item.text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

const SEVERITY = {
  critical: { label: "Risco crítico", className: "text-[var(--rb-critical)]", Icon: ShieldAlert },
  high: { label: "Atenção", className: "text-[var(--rb-critical)]", Icon: AlertTriangle },
  moderate: { label: "Atenção moderada", className: "text-[var(--rb-warning)]", Icon: AlertTriangle },
} as const;

export function AttentionPointsSection({ items }: { items: ReportFinding[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-[var(--rb-muted)]">Nenhum ponto de atenção identificado nas respostas.</p>;
  }
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {items.map((item) => {
        const severity = SEVERITY[item.severity ?? "moderate"];
        return (
          <li key={item.title} className="flex gap-3 rounded-lg border border-[var(--rb-border)] bg-white p-4">
            <severity.Icon className={`mt-0.5 size-5 shrink-0 ${severity.className}`} aria-hidden />
            <div>
              <p className="font-semibold">
                {item.title}{" "}
                <span className={`text-xs font-semibold ${severity.className}`}>({severity.label})</span>
              </p>
              <p className="text-sm text-[var(--rb-muted)]">{item.text}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function OpportunitiesSection({ items }: { items: ReportOpportunity[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-[var(--rb-muted)]">Nenhuma oportunidade derivada das respostas.</p>;
  }
  return (
    <div className="space-y-3">
      <ol className="grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <li key={item.number} className="flex gap-4 rounded-lg border border-[var(--rb-border)] bg-white p-4">
            <span className="text-2xl font-bold tabular-nums text-[var(--rb-orange)]" aria-hidden>
              {String(item.number).padStart(2, "0")}
            </span>
            <div>
              <p className="font-semibold">{item.title}</p>
              <p className="text-sm text-[var(--rb-muted)]">{item.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="flex items-start gap-1.5 text-xs text-[var(--rb-muted)]">
        <Lightbulb className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Oportunidades derivadas das respostas registradas; não constituem recomendação técnica
        definitiva.
      </p>
    </div>
  );
}

/* --------------------------------------------------------------- análise */
export function AnalysisSection({ report }: { report: MaturityReport }) {
  const groups = [
    ["Dados observados", "Informações fornecidas pela empresa.", report.analysis.observed_data],
    ["Indicadores calculados", "Resultados derivados das respostas.", report.analysis.calculated_indicators],
    ["Interpretação", "Leitura dos resultados.", report.analysis.interpretation],
    ["Oportunidades", "Possíveis áreas de melhoria.", report.analysis.opportunities],
  ] as const;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {groups.map(([title, subtitle, items]) => (
        <Panel key={title}>
          <h3 className="font-semibold">{title}</h3>
          <p className="mb-2 text-xs text-[var(--rb-muted)]">{subtitle}</p>
          {items.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--rb-muted)]">Sem registros.</p>
          )}
        </Panel>
      ))}
    </div>
  );
}

export function ConclusionSection({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="space-y-3 leading-relaxed">
      {paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  );
}

export function ScopeSection({ report }: { report: MaturityReport }) {
  return (
    <div className="space-y-4">
      <p>{report.scope.text}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Panel>
          <h3 className="mb-2 font-semibold">Eixos avaliados</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {report.scope.evaluated_axes.map((axis) => (
              <li key={axis}>{axis}</li>
            ))}
          </ul>
        </Panel>
        <Panel>
          <h3 className="mb-2 font-semibold">Eixos não avaliados</h3>
          {report.scope.pending_axes.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {report.scope.pending_axes.map((axis) => (
                <li key={axis}>{axis} — em manutenção</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--rb-muted)]">Nenhum.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}

export function MethodologySection({ report }: { report: MaturityReport }) {
  const m = report.methodology;
  return (
    <div className="space-y-4 text-sm leading-relaxed">
      <p>{m.objective}</p>
      <MethodList title="Eixos" items={m.axes.map((a) => [a.title, a.description])} />
      <MethodList title="Pilares de cálculo" items={m.pillars.map((p) => [p.title, p.description])} />
      <MethodList title="Pontuação" items={m.scoring.map((s) => [null, s])} />
      <MethodList title="Significado dos resultados" items={m.results.map((s) => [null, s])} />
      {m.maturity_scale.length > 0 ? (
        <MethodList title="Níveis de maturidade" items={m.maturity_scale.map((l) => [l.title, l.description])} />
      ) : null}
      {m.maturity_scale_note ? <p className="text-[var(--rb-muted)]">{m.maturity_scale_note}</p> : null}
      <p className="text-xs text-[var(--rb-muted)]">
        Versões — questionário {report.versions.diagnostic_version} · metodologia{" "}
        {report.versions.methodology_version} · relatório {report.versions.report_version}
      </p>
    </div>
  );
}

function MethodList({ title, items }: { title: string; items: [string | null, string | null][] }) {
  return (
    <div>
      <h3 className="mb-1 font-semibold">{title}</h3>
      <ul className="list-disc space-y-1 pl-5">
        {items.map(([label, text], index) => (
          <li key={`${label}-${index}`}>
            {label ? <span className="font-medium">{label}</span> : null}
            {label && text ? ": " : null}
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------ identificação */
const ORIGIN = {
  registry: { label: "Dado cadastral", className: "text-sky-700", Icon: Database },
  adjusted: { label: "Ajustado no diagnóstico", className: "text-[var(--rb-warning)]", Icon: PencilLine },
  diagnostic: { label: "Coletado no diagnóstico", className: "text-[var(--rb-muted)]", Icon: PencilLine },
} as const;

export function CompanySection({ report }: { report: MaturityReport }) {
  return (
    <div className="space-y-3">
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {Object.values(ORIGIN).map(({ label, className, Icon }) => (
          <span key={label} className={`inline-flex items-center gap-1 ${className}`}>
            <Icon className="size-3.5" aria-hidden />
            {label}
          </span>
        ))}
      </p>
      <dl className="grid gap-3 sm:grid-cols-2">
        {report.identification.map((field) => {
          const origin = ORIGIN[field.origin];
          return (
            <div key={field.question_id} className="rounded-lg border border-[var(--rb-border)] bg-white p-3">
              <dt className="text-xs uppercase tracking-wide text-[var(--rb-muted)]">{field.label}</dt>
              <dd className="font-medium">{field.value ?? "—"}</dd>
              <dd className={`mt-1 inline-flex items-center gap-1 text-xs ${origin.className}`}>
                <origin.Icon className="size-3" aria-hidden />
                {origin.label}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

/* ------------------------------------------------------------ respostas */
export function AnswersSection({ report }: { report: MaturityReport }) {
  return (
    <div className="space-y-3">
      {report.answers.map((step) => (
        <details
          key={step.step_id}
          className="group rounded-lg border border-[var(--rb-border)] bg-white open:shadow-sm"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rb-green)]">
            <span>{step.title}</span>
            <span className="flex items-center gap-2 text-xs font-medium text-[var(--rb-muted)]">
              {step.status === "maintenance" ? "Em manutenção" : null}
              <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
            </span>
          </summary>
          <div className="space-y-4 border-t border-[var(--rb-border)] px-4 py-4">
            {step.status === "maintenance" ? (
              <p className="text-sm text-[var(--rb-muted)]">Eixo não avaliado neste diagnóstico.</p>
            ) : (
              step.sections.map((section) => (
                <div key={section.title}>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--rb-green)]">
                    {section.title}
                  </h4>
                  <dl className="divide-y divide-[var(--rb-border)]">
                    {section.answers.map((answer) => (
                      <div key={answer.question_id} className="grid gap-1 py-2 text-sm sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] sm:gap-4">
                        <dt className="text-[var(--rb-muted)]">
                          {answer.code ? <span className="mr-1.5 text-xs">{answer.code}</span> : null}
                          {answer.label}
                        </dt>
                        <dd className="font-medium">
                          {answer.answer ?? "—"}
                          {answer.scored ? (
                            <span className="ml-2 whitespace-nowrap text-xs font-semibold text-[var(--rb-green)]">
                              {answer.points ?? "—"}/{answer.max_points} pts
                              {answer.pillar_code ? ` · ${answer.pillar_code}` : ""}
                            </span>
                          ) : null}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))
            )}
          </div>
        </details>
      ))}
    </div>
  );
}

/* --------------------------------------------------------------- rodapé */
export function ReportFooter({ report }: { report: MaturityReport }) {
  return (
    <footer className="flex flex-col gap-1 border-t border-[var(--rb-border)] px-5 py-4 text-xs text-[var(--rb-muted)] sm:flex-row sm:justify-between sm:px-10">
      <span>
        <span className="font-semibold text-[var(--rb-green)]">ECONMESH</span> · Diagnóstico de
        Maturidade Circular
      </span>
      <span>Relatório gerado em {formatDate(report.generated_at)}</span>
    </footer>
  );
}
