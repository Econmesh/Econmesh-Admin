"use client";

import { Suspense } from "react";

import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { DiagnosticCompanies } from "@/modules/diagnostics/components/diagnostic-companies";
import { DmcOnly } from "@/modules/diagnostics/components/dmc-only";

export default function DiagnosticosPage() {
  return (
    <DmcOnly>
      <Suspense fallback={<PageSkeleton />}>
        <DiagnosticCompanies />
      </Suspense>
    </DmcOnly>
  );
}
