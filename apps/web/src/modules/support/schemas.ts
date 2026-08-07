export const SUPPORT_STATUS_LABELS: Record<string, string> = {
  open: "Aberto",
  in_progress: "Em atendimento",
  closed: "Encerrado",
};

/** Badge variants: open=yellow, in_progress=green, closed=red */
export const SUPPORT_STATUS_BADGE_VARIANT: Record<
  string,
  "warning" | "success" | "destructive"
> = {
  open: "warning",
  in_progress: "success",
  closed: "destructive",
};
