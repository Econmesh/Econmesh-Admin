"use client";

import { Badge } from "@econmesh-admin/ui/components/badge";
import { Button } from "@econmesh-admin/ui/components/button";
import { Card, CardContent } from "@econmesh-admin/ui/components/card";
import { Input } from "@econmesh-admin/ui/components/input";
import { Skeleton } from "@econmesh-admin/ui/components/skeleton";
import { Building2, ClipboardList, History, Play, Search } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/feedback/empty-state";
import { ProgressIndicator } from "@/modules/diagnostics/components/progress-indicator";
import { formatCnpj, formatDateTime } from "@/modules/diagnostics/lib/rules";
import {
  diagnosticsService,
  type DiagnosticCompanyItem,
} from "@/services/dmc/diagnostics.service";
import { ApiError } from "@/utils/errors";

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function DiagnosticCompanies() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const focusCompanyId = searchParams.get("empresa");
  const [items, setItems] = useState<DiagnosticCompanyItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    void diagnosticsService
      .companies()
      .then((data) => setItems(data.items))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Não foi possível carregar as empresas."),
      );
  }, []);

  const filtered = useMemo(() => {
    if (!items) return [];
    const term = normalize(query.trim());
    const digits = query.replace(/\D/g, "");
    return items.filter((item) => {
      if (focusCompanyId && !term && item.company_id !== focusCompanyId) return false;
      if (!term) return true;
      return (
        normalize(item.legal_name).includes(term) ||
        normalize(item.trade_name ?? "").includes(term) ||
        normalize(item.sector ?? "").includes(term) ||
        (digits.length > 0 && item.tax_id.includes(digits))
      );
    });
  }, [items, query, focusCompanyId]);

  const inProgress = (items ?? []).filter((item) => item.open_diagnostic);

  async function start(item: DiagnosticCompanyItem) {
    setStarting(item.company_id);
    try {
      const detail = await diagnosticsService.start(item.company_id);
      router.push(`/dashboard/diagnosticos/${detail.id}` as Route);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Não foi possível iniciar o diagnóstico.");
      setStarting(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Diagnóstico de Maturidade Circular</h1>
        <p className="text-sm text-muted-foreground">
          Selecione uma empresa da sua carteira para iniciar ou continuar o diagnóstico.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {items === null && !error ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : null}

      {items && inProgress.length > 0 ? (
        <section className="space-y-3" aria-labelledby="in-progress-title">
          <h2 id="in-progress-title" className="text-lg font-medium">
            Diagnósticos em andamento
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {inProgress.map((item) => {
              const diagnostic = item.open_diagnostic!;
              return (
                <Card key={diagnostic.id} className="rounded-xl">
                  <CardContent className="space-y-4 pt-6">
                    <div>
                      <p className="text-xs text-muted-foreground">Empresa</p>
                      <p className="font-medium">{item.legal_name}</p>
                    </div>
                    <ProgressIndicator value={diagnostic.progress} label="Progresso" />
                    <p className="text-xs text-muted-foreground">
                      Última atualização: {formatDateTime(diagnostic.updated_at)}
                    </p>
                    <Link
                      href={`/dashboard/diagnosticos/${diagnostic.id}` as Route}
                      className="inline-flex w-full"
                    >
                      <Button className="w-full" size="lg">
                        Continuar diagnóstico
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      ) : null}

      {items ? (
        <section className="space-y-3" aria-labelledby="companies-title">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h2 id="companies-title" className="text-lg font-medium">
              Empresas da sua carteira
            </h2>
            <div className="relative w-full sm:max-w-sm">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <label htmlFor="company-search" className="sr-only">
                Pesquisar empresa
              </label>
              <Input
                id="company-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Razão social, CNPJ ou segmento"
                className="pl-8"
              />
            </div>
          </div>

          {focusCompanyId && !query ? (
            <p className="text-xs text-muted-foreground">
              Mostrando a empresa selecionada.{" "}
              <Link href={"/dashboard/diagnosticos" as Route} className="text-primary hover:underline">
                Ver todas
              </Link>
            </p>
          ) : null}

          {items.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="Nenhuma empresa na sua carteira"
              description="Os diagnósticos são feitos para empresas vinculadas a você. Faça um pré-cadastro ou peça ao administrador para vincular empresas."
              action={
                <Link href="/dashboard/empresas" className="inline-flex">
                  <Button variant="outline">Ir para Empresas</Button>
                </Link>
              }
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Nenhuma empresa encontrada"
              description="Revise o termo pesquisado."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((item) => (
                <CompanyCard
                  key={item.company_id}
                  item={item}
                  starting={starting === item.company_id}
                  onStart={() => void start(item)}
                />
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}

function CompanyCard({
  item,
  starting,
  onStart,
}: {
  item: DiagnosticCompanyItem;
  starting: boolean;
  onStart: () => void;
}) {
  const open = item.open_diagnostic;
  return (
    <Card className="flex flex-col rounded-xl">
      <CardContent className="flex flex-1 flex-col gap-4 pt-6">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium leading-snug">{item.legal_name}</p>
            {item.registration_status === "pre_registered" ? (
              <Badge variant="warning">Pré-cadastro</Badge>
            ) : null}
          </div>
          {item.trade_name ? (
            <p className="text-sm text-muted-foreground">{item.trade_name}</p>
          ) : null}
          <dl className="grid gap-0.5 pt-1 text-xs text-muted-foreground">
            <div>
              <dt className="inline">CNPJ: </dt>
              <dd className="inline text-foreground">{formatCnpj(item.tax_id)}</dd>
            </div>
            <div>
              <dt className="inline">Segmento: </dt>
              <dd className="inline text-foreground">{item.sector || "Não informado"}</dd>
            </div>
          </dl>
        </div>

        {open ? (
          <div className="space-y-2">
            <ProgressIndicator value={open.progress} size="sm" label="Em andamento" />
            <p className="text-xs text-muted-foreground">
              Última atualização: {formatDateTime(open.updated_at)}
            </p>
          </div>
        ) : item.open_by_other_agent ? (
          <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
            Há um diagnóstico em andamento conduzido por outro agente DMC.
          </p>
        ) : null}

        {item.completed.length > 0 ? (
          <details className="group text-sm">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
              <History className="size-3.5" aria-hidden />
              Diagnósticos anteriores ({item.completed.length})
            </summary>
            <ul className="mt-2 space-y-1">
              {item.completed.map((diagnostic) => (
                <li key={diagnostic.id}>
                  <Link
                    href={`/dashboard/diagnosticos/${diagnostic.id}` as Route}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 text-xs hover:bg-accent"
                  >
                    <span>Concluído em {formatDateTime(diagnostic.completed_at)}</span>
                    <span className="text-primary">Ver</span>
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        ) : null}

        <div className="mt-auto">
          {open ? (
            <Link href={`/dashboard/diagnosticos/${open.id}` as Route} className="inline-flex w-full">
              <Button className="w-full" size="lg">
                <ClipboardList aria-hidden />
                Continuar diagnóstico
              </Button>
            </Link>
          ) : (
            <Button
              className="w-full"
              size="lg"
              variant={item.completed.length > 0 ? "outline" : "default"}
              disabled={item.open_by_other_agent || starting}
              onClick={onStart}
            >
              <Play aria-hidden />
              {starting
                ? "Iniciando…"
                : item.completed.length > 0
                  ? "Iniciar novo diagnóstico"
                  : "Iniciar diagnóstico"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
