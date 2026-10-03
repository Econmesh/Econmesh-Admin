"use client";

import { cn } from "@econmesh-admin/ui/lib/utils";
import { Check, ClipboardCheck, Lock } from "lucide-react";

export type StepperItemStatus =
  | "completed"
  | "in_progress"
  | "not_started"
  | "maintenance"
  | "locked";

export type StepperItem = {
  id: string;
  order: number;
  title: string;
  shortTitle: string;
  status: StepperItemStatus;
  percent?: number;
};

const STATUS_TEXT: Record<StepperItemStatus, string> = {
  completed: "Concluída",
  in_progress: "Em andamento",
  not_started: "Não iniciada",
  maintenance: "Em manutenção",
  locked: "Indisponível",
};

function StepMarker({ item, active }: { item: StepperItem; active: boolean }) {
  const base =
    "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold";
  if (item.status === "maintenance" || item.status === "locked") {
    return (
      <span className={cn(base, "border-dashed border-muted-foreground/40 text-muted-foreground")}>
        <Lock className="size-3.5" aria-hidden />
      </span>
    );
  }
  if (item.status === "completed") {
    return (
      <span className={cn(base, "border-emerald-600 bg-emerald-600 text-white")}>
        <Check className="size-4" aria-hidden />
      </span>
    );
  }
  if (item.id === "review") {
    return (
      <span className={cn(base, active ? "border-primary bg-primary text-primary-foreground" : "")}>
        <ClipboardCheck className="size-4" aria-hidden />
      </span>
    );
  }
  return (
    <span
      className={cn(
        base,
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background",
      )}
    >
      {item.order}
    </span>
  );
}

/**
 * Navegação entre etapas: lista vertical no desktop e faixa horizontal
 * rolável no mobile, para não ocupar o espaço do formulário.
 */
export function DiagnosticStepper({
  items,
  activeId,
  onSelect,
}: {
  items: StepperItem[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav aria-label="Etapas do diagnóstico">
      {/* Desktop */}
      <ol className="hidden space-y-1 lg:block">
        {items.map((item) => {
          const active = item.id === activeId;
          const disabled = item.status === "maintenance" || item.status === "locked";
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                aria-current={active ? "step" : undefined}
                aria-disabled={disabled || undefined}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "bg-primary/10" : "hover:bg-accent",
                  disabled && "opacity-70",
                )}
              >
                <StepMarker item={item} active={active} />
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-sm", active ? "font-semibold" : "font-medium")}>
                    {item.title}
                  </span>
                  <span
                    className={cn(
                      "block text-xs",
                      item.status === "maintenance"
                        ? "text-amber-700 dark:text-amber-400"
                        : "text-muted-foreground",
                    )}
                  >
                    {STATUS_TEXT[item.status]}
                    {item.percent != null && item.status !== "maintenance" && item.status !== "completed"
                      ? ` · ${item.percent}%`
                      : ""}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* Mobile / tablet */}
      <ol className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 lg:hidden">
        {items.map((item) => {
          const active = item.id === activeId;
          const disabled = item.status === "maintenance" || item.status === "locked";
          return (
            <li key={item.id} className="snap-start">
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                aria-current={active ? "step" : undefined}
                aria-disabled={disabled || undefined}
                aria-label={`${item.title} — ${STATUS_TEXT[item.status]}`}
                className={cn(
                  "flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "border-primary bg-primary/10 font-semibold" : "bg-background",
                  disabled && "border-dashed text-muted-foreground",
                )}
              >
                {item.status === "completed" ? (
                  <Check className="size-3.5 text-emerald-600" aria-hidden />
                ) : disabled ? (
                  <Lock className="size-3.5" aria-hidden />
                ) : (
                  <span className="text-xs text-muted-foreground">{item.order}</span>
                )}
                {item.shortTitle}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
