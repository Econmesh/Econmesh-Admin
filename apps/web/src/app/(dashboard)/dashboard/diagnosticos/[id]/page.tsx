"use client";

import { useParams } from "next/navigation";

import { DiagnosticForm } from "@/modules/diagnostics/components/diagnostic-form";
import { DmcOnly } from "@/modules/diagnostics/components/dmc-only";

export default function DiagnosticoPage() {
  const params = useParams<{ id: string }>();
  return (
    <DmcOnly>
      <DiagnosticForm key={params.id} diagnosticId={params.id} />
    </DmcOnly>
  );
}
