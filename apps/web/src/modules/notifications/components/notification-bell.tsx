"use client";

import { Button } from "@econmesh-admin/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@econmesh-admin/ui/components/dropdown-menu";
import { Bell } from "lucide-react";
import Link from "next/link";

import { useNotifications } from "@/contexts/notification-context";
import { getNotificationHref } from "@/modules/notifications/utils";
import type { UserNotification } from "@/types/api";

function NotificationMenuItem({
  notification,
  onRead,
}: {
  notification: UserNotification;
  onRead: (id: string) => void;
}) {
  const href = getNotificationHref(notification);

  return (
    <DropdownMenuItem
      key={notification.id}
      render={href ? <Link href={href} onClick={() => void onRead(notification.id)} /> : undefined}
      onClick={href ? undefined : () => void onRead(notification.id)}
    >
      <div className="flex flex-col gap-0.5">
        <span className="font-medium">{notification.title}</span>
        <span className="line-clamp-2 text-xs text-muted-foreground">{notification.body}</span>
      </div>
    </DropdownMenuItem>
  );
}

export function NotificationBell() {
  const { unreadNotifications, unreadCount, markRead, markAllRead } = useNotifications();
  const hasSupportNotifications = unreadNotifications.some((n) => n.kind === "support");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
            <Bell className="size-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        }
      />
      <DropdownMenuContent align="end" sideOffset={8} className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Notificações</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {unreadNotifications.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            Nenhuma notificação não lida.
          </p>
        ) : (
          unreadNotifications
            .slice(0, 8)
            .map((n) => <NotificationMenuItem key={n.id} notification={n} onRead={markRead} />)
        )}
        {unreadNotifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void markAllRead()}>
              Marcar todas como lidas
            </DropdownMenuItem>
          </>
        )}
        {hasSupportNotifications && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/dashboard/suporte" />}>
              Ver todos os chamados
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
