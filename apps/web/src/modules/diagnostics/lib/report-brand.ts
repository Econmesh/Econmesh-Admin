/**
 * Cores da identidade ECONMESH usadas no relatório — extraídas da logo oficial
 * (public/ECONMESH-LOGO.png). O tema do admin é neutro (cinzas), por isso o
 * relatório, que é um documento de marca, usa estes valores em um único lugar.
 * Os mesmos valores estão no gerador de PDF da API (report_pdf.py).
 */
export const REPORT_BRAND = {
  green: "#00593E",
  leaf: "#5BA033",
  orange: "#F07D12",
  ink: "#1F2A24",
  muted: "#5F6B66",
  surface: "#F2F7F4",
  border: "#D5E3DB",
  track: "#E4ECE8",
  critical: "#B42318",
  warning: "#B54708",
} as const;

/** Variáveis CSS aplicadas na raiz do relatório (consumidas via Tailwind arbitrário). */
export const REPORT_CSS_VARS = {
  "--rb-green": REPORT_BRAND.green,
  "--rb-leaf": REPORT_BRAND.leaf,
  "--rb-orange": REPORT_BRAND.orange,
  "--rb-ink": REPORT_BRAND.ink,
  "--rb-muted": REPORT_BRAND.muted,
  "--rb-surface": REPORT_BRAND.surface,
  "--rb-border": REPORT_BRAND.border,
  "--rb-track": REPORT_BRAND.track,
  "--rb-critical": REPORT_BRAND.critical,
  "--rb-warning": REPORT_BRAND.warning,
} as Record<string, string>;

export function formatNumber(value: number | null | undefined, digits = 1): string {
  if (value == null) return "—";
  return value.toLocaleString("pt-BR", { maximumFractionDigits: digits });
}
