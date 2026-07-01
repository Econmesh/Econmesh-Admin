"use client";

import { Button } from "@econmesh-admin/ui/components/button";
import { Skeleton } from "@econmesh-admin/ui/components/skeleton";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { NotificationGroupList } from "@/modules/notifications/components/notification-group-list";
import { adminNotificationGroupsService } from "@/services/admin/notifications.service";
import type { NotificationGroup } from "@/types/api";
import { ApiError } from "@/utils/errors";

export default function GruposNotificacaoPage() {
  const [groups, setGroups] = useState<NotificationGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminNotificationGroupsService.list({ page_size: 100 });
      setGroups(data.items);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Não foi possível carregar os grupos.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/dashboard/notificacoes" className="hover:underline">
              Notificações
            </Link>
            {" / "}Grupos
          </p>
          <h1 className="mt-1 text-2xl font-semibold">Grupos de notificação</h1>
          <p className="text-sm text-muted-foreground">
            Organize usuários em grupos reutilizáveis para envio de notificações.
          </p>
        </div>
        <Link href="/dashboard/notificacoes/grupos/novo" className="inline-flex">
          <Button>
            <Plus className="size-4" aria-hidden />
            Novo grupo
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : (
        <NotificationGroupList groups={groups} />
      )}
    </div>
  );
}
