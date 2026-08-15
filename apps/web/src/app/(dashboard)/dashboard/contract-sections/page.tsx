"use client";

import { Button } from "@econmesh-admin/ui/components/button";
import { Skeleton } from "@econmesh-admin/ui/components/skeleton";
import { cn } from "@econmesh-admin/ui/lib/utils";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { ContractSectionStructure } from "@/modules/contract-sections/components/contract-section-structure";
import { OPPORTUNITY_TYPE_OPTIONS } from "@/modules/contract-sections/schemas";
import { OpportunityTypeBadge } from "@/modules/opportunities/components/opportunity-type-badge";
import { adminContractSectionsService } from "@/services/admin/contract-sections.service";
import type {
  ContractPreviewResponse,
  ContractSection,
  OpportunityType,
  SystemSectionInfo,
} from "@/types/api";
import { ApiError } from "@/utils/errors";

type ScopeTab = "todos" | OpportunityType;

const SCOPE_TABS: { value: ScopeTab; label: string }[] = [
  { value: "todos", label: "Todos os tipos" },
  ...OPPORTUNITY_TYPE_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
  })),
];

export default function ContractSectionsPage() {
  const [systemSections, setSystemSections] = useState<SystemSectionInfo[]>([]);
  const [adminSections, setAdminSections] = useState<ContractSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState(false);
  const [scope, setScope] = useState<ScopeTab>("todos");
  const [view, setView] = useState<"estrutura" | "preview">("estrutura");
  const [preview, setPreview] = useState<ContractPreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const opportunityType = scope === "todos" ? undefined : scope;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminContractSectionsService.structure({
        opportunity_type: opportunityType,
      });
      setSystemSections(data.system_sections);
      setAdminSections(
        [...data.admin_sections].sort((a, b) => a.sort_order - b.sort_order),
      );
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Não foi possível carregar as seções.",
      );
    } finally {
      setLoading(false);
    }
  }, [opportunityType]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (scope === "todos") {
      setView("estrutura");
      setPreview(null);
      return;
    }
    let cancelled = false;
    setPreviewLoading(true);
    void adminContractSectionsService
      .preview(scope)
      .then((data) => {
        if (!cancelled) setPreview(data);
      })
      .catch((error) => {
        if (!cancelled) {
          toast.error(
            error instanceof ApiError
              ? error.message
              : "Não foi possível carregar a pré-visualização.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [scope]);

  async function handleMove(index: number, direction: -1 | 1) {
    if (scope !== "todos") {
      toast.error("Selecione “Todos os tipos” para reordenar as seções.");
      return;
    }
    const target = index + direction;
    if (target < 0 || target >= adminSections.length) return;
    const next = [...adminSections];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    setAdminSections(next);
    setReordering(true);
    try {
      const updated = await adminContractSectionsService.reorder(
        next.map((section) => section.id),
      );
      setAdminSections(
        [...updated.items].sort((a, b) => a.sort_order - b.sort_order),
      );
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Não foi possível reordenar as seções.",
      );
      await load();
    } finally {
      setReordering(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Seções contratuais</h1>
          <p className="text-sm text-muted-foreground">
            Visualize como o contrato fica em cada tipo de oportunidade:
            comercialização, simbiose industrial e compartilhamento de ativos.
          </p>
        </div>
        <Link href="/dashboard/contract-sections/novo" className="inline-flex">
          <Button>
            <Plus className="size-4" aria-hidden />
            Nova seção
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {SCOPE_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setScope(tab.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              scope === tab.value
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-background text-muted-foreground hover:border-muted-foreground/40",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {scope !== "todos" ? (
        <div className="flex flex-wrap items-center gap-2">
          <OpportunityTypeBadge type={scope} />
          <div className="flex rounded-md border border-border p-0.5">
            <button
              type="button"
              onClick={() => setView("estrutura")}
              className={cn(
                "rounded px-3 py-1 text-xs font-medium",
                view === "estrutura"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground",
              )}
            >
              Estrutura
            </button>
            <button
              type="button"
              onClick={() => setView("preview")}
              className={cn(
                "rounded px-3 py-1 text-xs font-medium",
                view === "preview"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground",
              )}
            >
              Pré-visualização
            </button>
          </div>
        </div>
      ) : null}

      {view === "preview" && scope !== "todos" ? (
        previewLoading ? (
          <Skeleton className="h-[32rem] rounded-xl" />
        ) : preview ? (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">{preview.title}</h2>
            <iframe
              title={preview.title}
              srcDoc={preview.html}
              className="min-h-[40rem] w-full rounded-xl border border-border bg-white"
            />
          </div>
        ) : null
      ) : loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <ContractSectionStructure
          systemSections={systemSections}
          adminSections={adminSections}
          reordering={reordering || scope !== "todos"}
          onMove={handleMove}
        />
      )}
      {scope !== "todos" && view === "estrutura" ? (
        <p className="text-xs text-muted-foreground">
          Selecione “Todos os tipos” para reordenar as seções administrativas.
        </p>
      ) : null}
    </div>
  );
}
