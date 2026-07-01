"use client";

import { Button } from "@econmesh-admin/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@econmesh-admin/ui/components/dropdown-menu";
import { Bell } from "lucide-react";

import { useNotifications } from "@/contexts/notification-context";

export function NotificationBell() {
  const { unreadNotifications, unreadCount, markRead, markAllRead } = useNotifications();

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
        <DropdownMenuLabel>Notificações</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {unreadNotifications.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            Nenhuma notificação não lida.
          </p>
        ) : (
          unreadNotifications.slice(0, 8).map((n) => (
            <DropdownMenuItem key={n.id} onClick={() => void markRead(n.id)}>
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">{n.title}</span>
                <span className="line-clamp-2 text-xs text-muted-foreground">{n.body}</span>
              </div>
            </DropdownMenuItem>
          ))
        )}
        {unreadNotifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void markAllRead()}>
              Marcar todas como lidas
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
