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
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { UserAccessGrantCard } from "@/modules/billing/components/user-access-grant-card";
import { ProfileView } from "@/modules/profile/components/profile-view";
import { DeleteUserDialog } from "@/modules/users/components/delete-user-dialog";
import { UserVisualSignaturesCard } from "@/modules/users/components/user-visual-signatures-card";
import { ROLE_OPTIONS } from "@/modules/users/schemas";
import type { AdminUserListItem, UserProfile } from "@/types/api";

type UserDetailViewProps = {
  user: AdminUserListItem;
  profile: UserProfile;
  canDelete?: boolean;
  onDeleted: () => void;
};

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR");
}

export function UserDetailView({
  user,
  profile,
  canDelete = true,
  onDeleted,
}: UserDetailViewProps) {
  const [showDelete, setShowDelete] = useState(false);
  const roleLabel =
    ROLE_OPTIONS.find((option) => option.value === user.role)?.label ?? user.role;

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{user.name ?? "Sem nome"}</h1>
            <p className="text-sm text-muted-foreground">{user.email ?? "Sem e-mail"}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href={`/dashboard/usuarios/${user.id}/editar`} className="inline-flex">
              <Button variant="outline">
                <Pencil className="size-4" aria-hidden />
                Editar
              </Button>
            </Link>
            {canDelete ? (
              <Button variant="destructive" onClick={() => setShowDelete(true)}>
                <Trash2 className="size-4" aria-hidden />
                Excluir
              </Button>
            ) : null}
          </div>
        </div>

        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Conta</CardTitle>
            <CardDescription>Status e permissões na plataforma.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Perfil</dt>
                <dd className="mt-1 text-sm">{roleLabel}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Status</dt>
                <dd className="mt-1">
                  <Badge variant={user.is_active ? "default" : "secondary"}>
                    {user.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Verificado</dt>
                <dd className="mt-1 text-sm">{user.is_verified ? "Sim" : "Não"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">
                  Último acesso
                </dt>
                <dd className="mt-1 text-sm">{formatDateTime(user.last_login_at)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <UserAccessGrantCard userId={user.id} />

        <UserVisualSignaturesCard userId={user.id} />

        <ProfileView profile={profile} />
      </div>

      <DeleteUserDialog
        user={user}
        open={showDelete}
        onOpenChange={setShowDelete}
        onDeleted={onDeleted}
      />
    </>
  );
}
