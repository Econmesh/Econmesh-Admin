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
import { Pencil, Users } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/feedback/empty-state";
import type { NotificationGroup } from "@/types/api";

type NotificationGroupListProps = {
  groups: NotificationGroup[];
};

export function NotificationGroupList({ groups }: NotificationGroupListProps) {
  if (groups.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Nenhum grupo cadastrado"
        description="Crie grupos para enviar notificações a conjuntos de usuários."
        action={
          <Link href="/dashboard/notificacoes/grupos/novo" className="inline-flex">
            <Button>Novo grupo</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {groups.map((group) => (
        <Card key={group.id} className="rounded-xl">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base">{group.name}</CardTitle>
                {group.description ? (
                  <CardDescription>{group.description}</CardDescription>
                ) : null}
              </div>
              <Badge variant={group.is_active ? "default" : "secondary"}>
                {group.is_active ? "Ativo" : "Inativo"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {group.user_ids.length} usuário(s)
            </p>
            <Link href={`/dashboard/notificacoes/grupos/${group.id}`} className="inline-flex">
              <Button size="sm" variant="outline">
                <Pencil className="size-4" aria-hidden />
                Editar
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
