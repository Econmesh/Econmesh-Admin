"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

import { diagnosticsService } from "@/services/dmc/diagnostics.service";
import { ApiError } from "@/utils/errors";

/** Gera o PDF no servidor (a partir do relatório persistido) e inicia o download. */
export function useReportPdf(diagnosticId: string, fileLabel?: string) {
  const [generating, setGenerating] = useState(false);

  const download = useCallback(async () => {
    setGenerating(true);
    const toastId = toast.loading("Gerando relatório PDF...");
    try {
      const buffer = await diagnosticsService.reportPdf(diagnosticId);
      const blob = new Blob([buffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const slug = (fileLabel ?? "relatorio")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase();
      link.href = url;
      link.download = `diagnostico-maturidade-circular-${slug || "empresa"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      toast.success("Relatório PDF gerado com sucesso.", { id: toastId });
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Não foi possível gerar o PDF. Tente novamente.",
        { id: toastId },
      );
    } finally {
      setGenerating(false);
    }
  }, [diagnosticId, fileLabel]);

  return { generating, download };
}
