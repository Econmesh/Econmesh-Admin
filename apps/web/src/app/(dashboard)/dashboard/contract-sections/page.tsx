"use client";

import { Button } from "@econmesh-admin/ui/components/button";
import { Skeleton } from "@econmesh-admin/ui/components/skeleton";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { ContractSectionStructure } from "@/modules/contract-sections/components/contract-section-structure";
import { CONTRACT_TYPE_OPTIONS } from "@/modules/contract-sections/schemas";
import { adminContractSectionsService } from "@/services/admin/contract-sections.service";
import type {
  ContractSection,
  SectionAppliesTo,
  SystemSectionInfo,
} from "@/types/api";
import { ApiError } from "@/utils/errors";

export default function ContractSectionsPage() {
  const [systemSections, setSystemSections] = useState<SystemSectionInfo[]>([]);
  const [adminSections, setAdminSections] = useState<ContractSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState(false);
  const [contractType, setContractType] = useState<SectionAppliesTo | "">("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminContractSectionsService.structure({
        contract_type: contractType || undefined,
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
  }, [contractType]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleMove(index: number, direction: -1 | 1) {
    if (contractType) {
      toast.error("Limpe o filtro de escopo para reordenar as seções.");
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
            Visualize a estrutura completa da minuta: seções automáticas do sistema
            e seções configuradas pelo administrador.
          </p>
        </div>
        <Link href="/dashboard/contract-sections/novo" className="inline-flex">
          <Button>
            <Plus className="size-4" aria-hidden />
            Nova seção
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-muted-foreground" htmlFor="filter-type">
          Filtrar seções admin por escopo
        </label>
        <select
          id="filter-type"
          value={contractType}
          onChange={(e) => setContractType(e.target.value as SectionAppliesTo | "")}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Todos</option>
          {CONTRACT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <ContractSectionStructure
          systemSections={systemSections}
          adminSections={adminSections}
          reordering={reordering || Boolean(contractType)}
          onMove={handleMove}
        />
      )}
      {contractType ? (
        <p className="text-xs text-muted-foreground">
          Limpe o filtro de escopo para reordenar as seções administrativas.
        </p>
      ) : null}
    </div>
  );
}
