"use client";

import { Badge } from "@econmesh-admin/ui/components/badge";
import { cn } from "@econmesh-admin/ui/lib/utils";
import { CheckCircle2, ChevronDown, CircleDashed } from "lucide-react";
import { useEffect, useId, useState, type ReactNode } from "react";

import type { LocalStepProgress } from "@/modules/diagnostics/lib/rules";

/** Situação de preenchimento de um produto/resíduo (todas as obrigatórias visíveis). */
export function ItemStatusBadge({ progress }: { progress?: LocalStepProgress }) {
  if (!progress || progress.requiredTotal === 0) {
    return <Badge variant="outline">Sem perguntas obrigatórias</Badge>;
  }
  const missing = progress.requiredTotal - progress.requiredAnswered;
  if (missing === 0) {
    return (
      <Badge variant="success" className="gap-1">
        <CheckCircle2 className="size-3" aria-hidden />
        Preenchido
      </Badge>
    );
  }
  return (
    <Badge variant="warning" className="gap-1">
      <CircleDashed className="size-3" aria-hidden />
      {missing} {missing === 1 ? "pendente" : "pendentes"}
    </Badge>
  );
}

/**
 * Bloco expansível (efeito sanfona) de um produto/resíduo. O conteúdo continua
 * montado quando recolhido — as respostas ficam no estado do formulário, então
 * expandir, recolher ou trocar de etapa não perde nada.
 */
export function ItemAccordion({
  title,
  eyebrow,
  progress,
  defaultOpen = false,
  forceOpen = false,
  children,
}: {
  title: string;
  eyebrow?: string;
  progress?: LocalStepProgress;
  defaultOpen?: boolean;
  /** Abre automaticamente (ex.: há pendências destacadas dentro do bloco). */
  forceOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen || forceOpen);
  const contentId = useId();

  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);

  return (
    <div
      className={cn(
        "rounded-xl border transition-colors",
        open ? "border-primary/30 bg-background" : "bg-muted/20 hover:bg-muted/40",
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="min-w-0 flex-1">
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
              {eyebrow}
            </p>
          ) : null}
          <p className="truncate text-sm font-semibold">{title}</p>
        </div>
        {progress ? <ItemStatusBadge progress={progress} /> : null}
        <ChevronDown
          className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      <div id={contentId} hidden={!open} className="border-t px-4 pb-5 pt-4">
        {children}
      </div>
    </div>
  );
}
