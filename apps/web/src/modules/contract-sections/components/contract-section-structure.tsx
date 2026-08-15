"use client";

import { Badge } from "@econmesh-admin/ui/components/badge";
import { Button } from "@econmesh-admin/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@econmesh-admin/ui/components/card";
import { ArrowDown, ArrowUp, FileText, Lock, Pencil, Plus } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/feedback/empty-state";
import { OpportunityTypeBadge } from "@/modules/opportunities/components/opportunity-type-badge";
import type { ContractSection, SystemSectionInfo } from "@/types/api";

type ContractSectionStructureProps = {
  systemSections: SystemSectionInfo[];
  adminSections: ContractSection[];
  reordering?: boolean;
  onMove: (index: number, direction: -1 | 1) => void;
};

export function ContractSectionStructure({
  systemSections,
  adminSections,
  reordering = false,
  onMove,
}: ContractSectionStructureProps) {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Estrutura padrão da minuta</h2>
          <p className="text-sm text-muted-foreground">
            Seções automáticas e obrigatórias. Ordem fixa — não podem ser editadas,
            excluídas ou reordenadas.
          </p>
        </div>
        <ol className="space-y-3">
          {systemSections.map((section, index) => (
            <li key={section.key}>
              <Card className="rounded-xl border-dashed bg-muted/20">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <span className="text-muted-foreground">{index + 1}.</span>
                        {section.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Seção automática do sistema
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="shrink-0 gap-1">
                      <Lock className="size-3" aria-hidden />
                      Fixa
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Seções do administrador</h2>
            <p className="text-sm text-muted-foreground">
              Aparecem após as seções automáticas. Reordene livremente; a ordem é
              aplicada nas minutas em negociação.
            </p>
          </div>
          <Link href="/dashboard/contract-sections/novo" className="inline-flex">
            <Button size="sm">
              <Plus className="size-4" aria-hidden />
              Nova seção
            </Button>
          </Link>
        </div>

        {adminSections.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nenhuma seção administrativa"
            description="Crie seções que serão carregadas automaticamente nas minutas após as quatro seções fixas."
            action={
              <Link href="/dashboard/contract-sections/novo" className="inline-flex">
                <Button>Nova seção</Button>
              </Link>
            }
          />
        ) : (
          <ol className="space-y-3" start={systemSections.length + 1}>
            {adminSections.map((section, index) => (
              <li key={section.id}>
                <Card className="rounded-xl">
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <span className="text-muted-foreground">
                            {systemSections.length + index + 1}.
                          </span>
                          {section.title}
                        </CardTitle>
                        <CardDescription className="mt-1 flex flex-wrap items-center gap-1">
                          {(section.opportunity_types?.length
                            ? section.opportunity_types
                            : ([
                                "comercializacao",
                                "simbiose_industrial",
                                "compartilhamento",
                              ] as const)
                          ).map((type) => (
                            <OpportunityTypeBadge key={type} type={type} />
                          ))}
                          <span className="text-muted-foreground">
                            {" · "}
                            {section.is_company_editable
                              ? "Editável pelas empresas"
                              : "Somente leitura para empresas"}
                          </span>
                        </CardDescription>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-1">
                        <Badge variant={section.is_active ? "default" : "secondary"}>
                          {section.is_active ? "Ativa" : "Inativa"}
                        </Badge>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          disabled={reordering || index === 0}
                          onClick={() => onMove(index, -1)}
                          aria-label="Mover para cima"
                        >
                          <ArrowUp className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          disabled={reordering || index === adminSections.length - 1}
                          onClick={() => onMove(index, 1)}
                          aria-label="Mover para baixo"
                        >
                          <ArrowDown className="size-4" />
                        </Button>
                        <Link
                          href={`/dashboard/contract-sections/${section.id}`}
                          className="inline-flex"
                        >
                          <Button size="sm" variant="outline">
                            <Pencil className="size-4" aria-hidden />
                            Editar
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {section.content_html.replace(/<[^>]+>/g, " ").trim()}
                    </p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
