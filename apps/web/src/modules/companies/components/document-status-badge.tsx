"use client";

import { Badge } from "@econmesh-admin/ui/components/badge";

import { COMPLIANCE_STATUS_LABELS, complianceStatus } from "@/modules/companies/schemas";
import type { CompanyComplianceFile } from "@/types/api";

const VARIANT: Record<string, "warning" | "success" | "destructive"> = {
  pending: "warning",
  approved: "success",
  rejected: "destructive",
};

export function DocumentStatusBadge({
  file,
  status,
}: {
  file?: CompanyComplianceFile | null;
  status?: string;
}) {
  const resolved = status ?? (file ? complianceStatus(file) : null);
  if (!resolved) return null;
  return (
    <Badge variant={VARIANT[resolved] ?? "outline"}>
      {COMPLIANCE_STATUS_LABELS[resolved] ?? resolved}
    </Badge>
  );
}
