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
import { NotificationItem } from "@/modules/notifications/components/notification-item";
import { getNotificationHref } from "@/modules/notifications/utils";

export function NotificationBell() {
  const { unreadNotifications, unreadCount, markRead, markAllRead } = useNotifications();
  const hasUnread = unreadNotifications.length > 0;
  const hasSupportNotifications = unreadNotifications.some((n) => n.kind === "support");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={`Notificações${unreadCount > 0 ? `, ${unreadCount} não lidas` : ""}`}
          />
        }
      >
        <Bell className="size-5" />
        {unreadCount > 0 ? (
          <span
            className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white shadow-md ring-2 ring-background"
            aria-hidden
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-80 p-0">
        <DropdownMenuGroup className="px-2 pt-2">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Notificações</span>
            {unreadCount > 0 ? (
              <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                {unreadCount} não {unreadCount === 1 ? "lida" : "lidas"}
              </span>
            ) : null}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        {hasUnread ? (
          <div className="max-h-72 overflow-y-auto">
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-red-600">
              Não lidas
            </p>
            {unreadNotifications.slice(0, 8).map((notification) => {
              const href = getNotificationHref(notification);

              return (
                <DropdownMenuItem
                  key={notification.id}
                  className="cursor-pointer rounded-none p-0 focus:bg-transparent"
                  render={
                    href ? (
                      <Link href={href} onClick={() => void markRead(notification.id)} />
                    ) : undefined
                  }
                  onClick={href ? undefined : () => void markRead(notification.id)}
                >
                  <NotificationItem notification={notification} compact interactive={false} />
                </DropdownMenuItem>
              );
            })}
          </div>
        ) : (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            Nenhuma notificação não lida.
          </p>
        )}

        {hasUnread ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void markAllRead()} className="mx-1">
              Marcar todas como lidas
            </DropdownMenuItem>
          </>
        ) : null}

        {hasSupportNotifications ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/dashboard/suporte" />} className="mx-1 mb-1">
              Ver todos os chamados
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
