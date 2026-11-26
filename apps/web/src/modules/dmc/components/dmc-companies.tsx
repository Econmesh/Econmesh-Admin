"use client";

import { Badge } from "@econmesh-admin/ui/components/badge";
import { Button } from "@econmesh-admin/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@econmesh-admin/ui/components/card";
import { Input } from "@econmesh-admin/ui/components/input";
import type { Route } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { DmcPreRegistrationForm } from "@/modules/dmc/components/dmc-pre-registration-form";
import { dmcAgentService, type DmcCompany, type DmcCompanyUser } from "@/services/dmc/dmc.service";
import { ApiError } from "@/utils/errors";

function PreRegistrationBadge({ company }: { company: DmcCompany }) {
  if (company.registration_status !== "pre_registered") return null;
  return <Badge variant="warning">Pré-cadastro</Badge>;
}

export function DmcCompaniesView() {
  const [portfolio, setPortfolio] = useState<DmcCompany[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DmcCompany[] | null>(null);

  useEffect(() => {
    void dmcAgentService.companies().then((data) => setPortfolio(data.items));
  }, []);

  async function search() {
    try {
      const data = await dmcAgentService.searchCompanies(query);
      setResults(data.items);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Falha na pesquisa.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Empresas</h1>
          <p className="text-sm text-muted-foreground">
            Carteira sob sua responsabilidade. A pesquisa não inclui a empresa na carteira.
          </p>
        </div>
        <Link href={"/dashboard/empresas/pre-cadastro" as Route} className="inline-flex">
          <Button>
            <Plus className="size-4" aria-hidden />
            Pré-cadastro de empresa
          </Button>
        </Link>
      </div>
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Pesquisar no cadastro</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Razão social, nome fantasia ou CNPJ"
            className="max-w-md"
          />
          <Button type="button" onClick={() => void search()}>
            Pesquisar
          </Button>
        </CardContent>
      </Card>
      {results ? (
        <CompanySection title="Resultado da pesquisa" items={results} />
      ) : null}
      <CompanySection title="Sua carteira" items={portfolio} />
    </div>
  );
}

function CompanySection({ title, items }: { title: string; items: DmcCompany[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-medium">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma empresa.</p>
      ) : (
        <div className="grid gap-3">
          {items.map((company) => (
            <Link
              key={company.id}
              href={`/dashboard/empresas/${company.id}`}
              className="rounded-xl border px-4 py-3 hover:bg-accent"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{company.trade_name || company.legal_name}</p>
                <PreRegistrationBadge company={company} />
              </div>
              <p className="text-sm text-muted-foreground">
                {company.tax_id}
                {company.city ? ` · ${company.city}/${company.state ?? ""}` : ""}
              </p>
              <p className="mt-1 text-xs">
                {company.in_portfolio ? "Na sua carteira" : "Somente consulta"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export function DmcCompanyDetailView({ companyId }: { companyId: string }) {
  const [company, setCompany] = useState<DmcCompany | null>(null);
  const [users, setUsers] = useState<DmcCompanyUser[]>([]);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    void dmcAgentService.company(companyId).then(setCompany);
    void dmcAgentService
      .companyUsers(companyId)
      .then(setUsers)
      .catch(() => setUsersError("Usuários disponíveis apenas para empresas da sua carteira."));
  }, [companyId]);

  if (!company) return <p className="text-sm text-muted-foreground">Carregando empresa…</p>;

  const isPreRegistered = company.registration_status === "pre_registered";
  const canEdit = isPreRegistered && company.in_portfolio;

  if (editing && canEdit) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm text-muted-foreground">Editar pré-cadastro</p>
          <h1 className="text-2xl font-semibold">{company.legal_name}</h1>
        </div>
        <DmcPreRegistrationForm
          company={company}
          submitLabel="Salvar alterações"
          onCancel={() => setEditing(false)}
          onSubmit={async (payload) => {
            try {
              const updated = await dmcAgentService.updatePreRegistration(company.id, payload);
              setCompany(updated);
              setEditing(false);
              toast.success("Pré-cadastro atualizado.");
            } catch (error) {
              const handledByForm = ["tax_id_exists", "validation_error"];
              if (error instanceof ApiError && handledByForm.includes(error.code)) throw error;
              toast.error(error instanceof ApiError ? error.message : "Falha ao salvar.");
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {company.in_portfolio
              ? "Empresa da sua carteira"
              : "Empresa encontrada — consulta limitada"}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">{company.legal_name}</h1>
            <PreRegistrationBadge company={company} />
          </div>
          <p className="text-sm text-muted-foreground">{company.trade_name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {company.in_portfolio ? (
            <Link href={`/dashboard/diagnosticos?empresa=${company.id}` as Route}>
              <Button type="button">Diagnóstico de maturidade</Button>
            </Link>
          ) : null}
          {canEdit ? (
            <Button type="button" variant="outline" onClick={() => setEditing(true)}>
              Editar pré-cadastro
            </Button>
          ) : null}
        </div>
      </div>
      {isPreRegistered ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          Pré-cadastro: a empresa ainda não tem usuário nem acesso à plataforma. Quando o
          responsável se cadastrar no app com esta razão social ou CNPJ, o cadastro é concluído
          a partir destes dados.
        </p>
      ) : null}
      <Card className="rounded-xl">
        <CardContent className="grid gap-2 pt-6 text-sm">
          <p>CNPJ: {company.tax_id}</p>
          <p>
            Local: {company.city ?? "—"} / {company.state ?? "—"}
          </p>
          <p>Setor: {company.sector ?? "—"}</p>
          {company.in_portfolio ? (
            <>
              <p>E-mail: {company.email ?? "—"}</p>
              <p>Telefone: {company.phone ?? "—"}</p>
              <p>
                Responsável:{" "}
                {company.owner_name ?? company.legal_representative ?? (isPreRegistered ? "Aguardando cadastro" : "—")}
              </p>
              <p>Origem: {company.source === "registered" ? "Cadastrada" : "Atribuída"}</p>
            </>
          ) : null}
        </CardContent>
      </Card>
      {company.in_portfolio ? (
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Usuários da empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {usersError ? <p>{usersError}</p> : null}
            {users.map((user) => (
              <p key={user.id}>
                {user.name ?? user.email} · {user.job_title ?? "Sem cargo"} · {user.email}
              </p>
            ))}
            {users.length === 0 && !usersError ? <p>Nenhum usuário vinculado.</p> : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
