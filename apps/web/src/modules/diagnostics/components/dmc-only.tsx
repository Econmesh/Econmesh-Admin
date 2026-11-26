"use client";

import { ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";

import { EmptyState } from "@/components/feedback/empty-state";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { useAuth } from "@/hooks/use-auth";

/** O diagnóstico é exclusivo do perfil Agente DMC (o backend também valida). */
export function DmcOnly({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading || !user) return <PageSkeleton />;
  if (user.role !== "dmc_agent") {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Acesso restrito"
        description="O Diagnóstico de Maturidade Circular é realizado pelos Agentes DMC."
      />
    );
  }
  return <>{children}</>;
}
