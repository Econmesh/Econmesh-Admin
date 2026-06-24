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
import { Eye, Pencil, Users } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/feedback/empty-state";
import type { AdminUserListItem } from "@/types/api";

type UserListProps = {
  users: AdminUserListItem[];
};

export function UserList({ users }: UserListProps) {
  if (users.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Nenhum usuário encontrado"
        description="Cadastre o primeiro usuário da plataforma."
        action={
          <Link href="/dashboard/usuarios/novo" className="inline-flex">
            <Button>Novo usuário</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {users.map((user) => (
        <Card key={user.id} className="rounded-xl">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <CardTitle className="truncate text-base">
                  {user.name ?? "Sem nome"}
                </CardTitle>
                <CardDescription className="truncate">{user.email}</CardDescription>
              </div>
              <Badge variant={user.is_active ? "default" : "secondary"}>
                {user.is_active ? "Ativo" : "Inativo"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="space-y-1 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Perfil</dt>
                <dd className="capitalize">{user.role}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Verificado</dt>
                <dd>{user.is_verified ? "Sim" : "Não"}</dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-2">
              <Link href={`/dashboard/usuarios/${user.id}`} className="inline-flex">
                <Button size="sm" variant="outline">
                  <Eye className="size-4" aria-hidden />
                  Ver
                </Button>
              </Link>
              <Link href={`/dashboard/usuarios/${user.id}`} className="inline-flex">
                <Button size="sm" variant="outline">
                  <Pencil className="size-4" aria-hidden />
                  Editar
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
