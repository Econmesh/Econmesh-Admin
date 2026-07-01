"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { NotificationGroupForm } from "@/modules/notifications/components/notification-group-form";
import { adminNotificationGroupsService } from "@/services/admin/notifications.service";
import { adminUsersService } from "@/services/admin/users.service";
import type { AdminUserListItem } from "@/types/api";
import type { NotificationGroupCreateFormValues } from "@/modules/notifications/schemas";

export default function NovoGrupoNotificacaoPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await adminUsersService.list({ page_size: 200, is_active: true });
        setUsers(data.items);
      } catch {
        toast.error("Não foi possível carregar usuários.");
      } finally {
        setLoading(false);
      }
    }
    void loadUsers();
  }, []);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard/notificacoes/grupos" className="hover:underline">
            Grupos
          </Link>
          {" / "}Novo grupo
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Criar grupo</h1>
      </div>

      <NotificationGroupForm
        mode="create"
        users={users}
        submitLabel="Criar grupo"
        onSubmit={async (values: NotificationGroupCreateFormValues) => {
          const group = await adminNotificationGroupsService.create(values);
          toast.success("Grupo criado com sucesso.");
          router.push(`/dashboard/notificacoes/grupos/${group.id}`);
        }}
      />
    </div>
  );
}
