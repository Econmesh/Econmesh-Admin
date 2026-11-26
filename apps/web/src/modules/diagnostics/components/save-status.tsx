import { AlertCircle, CheckCircle2, CloudOff, Loader2 } from "lucide-react";

import type { SaveState } from "@/modules/diagnostics/hooks/use-diagnostic-autosave";
import { formatDateTime } from "@/modules/diagnostics/lib/rules";

export function DiagnosticSaveStatus({
  state,
  lastSavedAt,
}: {
  state: SaveState;
  lastSavedAt: Date | null;
}) {
  let icon = null;
  let text = "";
  let tone = "text-muted-foreground";
  switch (state) {
    case "pending":
    case "saving":
      icon = <Loader2 className="size-3.5 animate-spin" aria-hidden />;
      text = "Salvando…";
      break;
    case "saved":
      icon = <CheckCircle2 className="size-3.5 text-emerald-600" aria-hidden />;
      text = "Progresso salvo";
      break;
    case "offline":
      icon = <CloudOff className="size-3.5 text-amber-600" aria-hidden />;
      text = "Sem conexão — alterações guardadas neste navegador";
      tone = "text-amber-700 dark:text-amber-400";
      break;
    case "error":
      icon = <AlertCircle className="size-3.5 text-destructive" aria-hidden />;
      text = "Algumas respostas não foram salvas";
      tone = "text-destructive";
      break;
    default:
      break;
  }
  return (
    <div className="flex flex-col gap-0.5 text-xs sm:items-end" aria-live="polite" role="status">
      {text ? (
        <span className={`inline-flex items-center gap-1.5 ${tone}`}>
          {icon}
          {text}
        </span>
      ) : null}
      <span className="text-muted-foreground">
        Última atualização: {lastSavedAt ? formatDateTime(lastSavedAt) : "—"}
      </span>
    </div>
  );
}
