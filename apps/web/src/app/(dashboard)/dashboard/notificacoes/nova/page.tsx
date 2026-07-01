"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { NotificationCampaignForm } from "@/modules/notifications/components/notification-campaign-form";
import {
  adminNotificationGroupsService,
  adminNotificationsService,
} from "@/services/admin/notifications.service";
import { adminUsersService } from "@/services/admin/users.service";
import type { AdminUserListItem, NotificationGroup } from "@/types/api";
import type { NotificationCampaignCreateFormValues } from "@/modules/notifications/schemas";

export default function NovaNotificacaoPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [groups, setGroups] = useState<NotificationGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [usersData, groupsData] = await Promise.all([
          adminUsersService.list({ page_size: 200, is_active: true }),
          adminNotificationGroupsService.list({ page_size: 100 }),
        ]);
        setUsers(usersData.items);
        setGroups(groupsData.items);
      } catch {
        toast.error("Não foi possível carregar dados do formulário.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function handleSubmit(values: NotificationCampaignCreateFormValues) {
    const campaign = await adminNotificationsService.create({
      title: values.title,
      body: values.body,
      channels: values.channels,
      target_type: values.target_type,
      target_user_ids: values.target_user_ids,
      target_group_ids: values.target_group_ids,
      send_at: values.send_now ? null : values.send_at,
    });
    toast.success(
      values.send_now ? "Notificação enviada com sucesso." : "Notificação agendada com sucesso.",
    );
    router.push(`/dashboard/notificacoes/${campaign.id}`);
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard/notificacoes" className="hover:underline">
            Notificações
          </Link>
          {" / "}Nova notificação
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Criar notificação</h1>
        <p className="text-sm text-muted-foreground">
          Envie para todos, usuários específicos ou grupos. Agende ou envie agora.
        </p>
      </div>

      <NotificationCampaignForm
        users={users}
        groups={groups}
        submitLabel="Enviar notificação"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
