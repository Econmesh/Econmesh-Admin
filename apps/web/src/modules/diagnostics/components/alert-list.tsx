import { AlertTriangle, ShieldAlert } from "lucide-react";

import type { DiagnosticAlert } from "@/services/dmc/diagnostics.service";

/** Alertas de risco gerados pelas respostas (não dependem só de cor: ícone + texto). */
export function AlertList({ alerts, title }: { alerts: DiagnosticAlert[]; title?: string }) {
  if (alerts.length === 0) return null;
  return (
    <section className="space-y-2" aria-label={title ?? "Alertas"}>
      {title ? <h3 className="text-sm font-semibold">{title}</h3> : null}
      {alerts.map((alert) => (
        <AlertBanner key={`${alert.question_id}-${alert.message}`} {...alert} />
      ))}
    </section>
  );
}

export function AlertBanner({ level, message }: Pick<DiagnosticAlert, "level" | "message">) {
  const critical = level === "critical";
  const Icon = critical ? ShieldAlert : AlertTriangle;
  return (
    <div
      role="alert"
      className={
        critical
          ? "flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          : "flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300"
      }
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>
        <strong>{critical ? "Risco crítico: " : "Atenção: "}</strong>
        {message.replace(/^Risco crítico:\s*/i, "")}
      </span>
    </div>
  );
}
