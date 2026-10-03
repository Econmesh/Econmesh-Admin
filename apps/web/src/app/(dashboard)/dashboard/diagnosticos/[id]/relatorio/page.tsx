"use client";

import { useParams } from "next/navigation";

import { DiagnosticReportView } from "@/modules/diagnostics/components/diagnostic-report";
import { DmcOnly } from "@/modules/diagnostics/components/dmc-only";

export default function DiagnosticoRelatorioPage() {
  const params = useParams<{ id: string }>();
  return (
    <DmcOnly>
      <DiagnosticReportView diagnosticId={params.id} />
    </DmcOnly>
  );
}
