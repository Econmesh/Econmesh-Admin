"use client";

import { Button } from "@econmesh-admin/ui/components/button";
import { Skeleton } from "@econmesh-admin/ui/components/skeleton";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { NotificationGroupForm } from "@/modules/notifications/components/notification-group-form";
import { adminNotificationGroupsService } from "@/services/admin/notifications.service";
import { adminUsersService } from "@/services/admin/users.service";
import type { AdminUserListItem, NotificationGroup } from "@/types/api";
import type { NotificationGroupUpdateFormValues } from "@/modules/notifications/schemas";
import { ApiError } from "@/utils/errors";

export default function EditarGrupoNotificacaoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [group, setGroup] = useState<NotificationGroup | null>(null);
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [groupData, usersData] = await Promise.all([
        adminNotificationGroupsService.get(params.id),
        adminUsersService.list({ page_size: 200, is_active: true }),
      ]);
      setGroup(groupData);
      setUsers(usersData.items);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Não foi possível carregar o grupo.",
      );
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete() {
    if (!group) return;
    setDeleting(true);
    try {
      await adminNotificationGroupsService.delete(group.id);
      toast.success("Grupo removido.");
      router.push("/dashboard/notificacoes/grupos");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Não foi possível remover.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <Skeleton className="h-64 rounded-xl" />;
  }

  if (!group) {
    return <p className="text-sm text-muted-foreground">Grupo não encontrado.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard/notificacoes/grupos" className="hover:underline">
            Grupos
          </Link>
          {" / "}Editar
        </p>
        <h1 className="mt-1 text-2xl font-semibold">{group.name}</h1>
      </div>

      <NotificationGroupForm
        mode="edit"
        initialData={group}
        users={users}
        submitLabel="Salvar alterações"
        onSubmit={async (values: NotificationGroupUpdateFormValues) => {
          const updated = await adminNotificationGroupsService.update(group.id, values);
          setGroup(updated);
          toast.success("Grupo atualizado.");
        }}
      />

      <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
        Remover grupo
      </Button>
    </div>
  );
}
