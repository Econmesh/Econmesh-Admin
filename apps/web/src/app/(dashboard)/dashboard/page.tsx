"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@econmesh-admin/ui/components/card";
import { Building2, Target, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { adminCompaniesService } from "@/services/admin/companies.service";
import { adminOpportunitiesService } from "@/services/admin/opportunities.service";
import { adminUsersService } from "@/services/admin/users.service";

export default function DashboardPage() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({ users: 0, companies: 0, opportunities: 0 });

  useEffect(() => {
    async function loadCounts() {
      try {
        const [users, companies, opportunities] = await Promise.all([
          adminUsersService.list({ page_size: 1 }),
          adminCompaniesService.list({ page_size: 1 }),
          adminOpportunitiesService.list({ page_size: 1 }),
        ]);
        setCounts({
          users: users.total,
          companies: companies.total,
          opportunities: opportunities.total,
        });
      } catch {
        /* summary is optional */
      }
    }
    void loadCounts();
  }, []);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Painel administrativo</h1>
        <p className="mt-1 text-muted-foreground">
          Olá, {user.name ?? user.email}. Gerencie a plataforma Econmesh.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/dashboard/usuarios">
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Usuários</CardTitle>
              <Users className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{counts.users}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/empresas">
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Empresas</CardTitle>
              <Building2 className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{counts.companies}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/oportunidades">
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Oportunidades</CardTitle>
              <Target className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{counts.opportunities}</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sessão admin</CardTitle>
          <CardDescription>Conta conectada ao painel</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-muted-foreground">E-mail</dt>
              <dd className="mt-1 text-sm font-medium">{user.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Papel</dt>
              <dd className="mt-1">
                <span className="inline-flex rounded-md bg-secondary px-2 py-0.5 text-xs font-medium">
                  {user.role}
                </span>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
