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
import { Eye, Pencil, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { EmptyState } from "@/components/feedback/empty-state";
import { useAuth } from "@/hooks/use-auth";
import { DeleteUserDialog } from "@/modules/users/components/delete-user-dialog";
import { ROLE_OPTIONS } from "@/modules/users/schemas";
import type { AdminUserListItem } from "@/types/api";

type UserListProps = {
  users: AdminUserListItem[];
  onDeleted: () => void;
};

export function UserList({ users, onDeleted }: UserListProps) {
  const { user: currentUser } = useAuth();
  const [deleteTarget, setDeleteTarget] = useState<AdminUserListItem | null>(null);

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
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {users.map((user) => {
          const roleLabel =
            ROLE_OPTIONS.find((option) => option.value === user.role)?.label ??
            user.role;
          const canDelete = currentUser?.id !== user.id;

          return (
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
                    <dd>{roleLabel}</dd>
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
                  <Link
                    href={`/dashboard/usuarios/${user.id}/editar`}
                    className="inline-flex"
                  >
                    <Button size="sm" variant="outline">
                      <Pencil className="size-4" aria-hidden />
                      Editar
                    </Button>
                  </Link>
                  {canDelete ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeleteTarget(user)}
                    >
                      <Trash2 className="size-4" aria-hidden />
                      Excluir
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {deleteTarget ? (
        <DeleteUserDialog
          user={deleteTarget}
          open={!!deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          onDeleted={onDeleted}
        />
      ) : null}
    </>
  );
}
