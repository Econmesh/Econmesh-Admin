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
import { Headphones } from "lucide-react";
import Link from "next/link";

import { useSupport } from "@/contexts/support-context";
import { formatTicketNumber } from "@/services/admin/support.service";

export function SupportBell() {
  const { alerts, unreadCount, dismissAlert, dismissAllAlerts } = useSupport();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="relative" aria-label="Suporte">
            <Headphones className="size-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        }
      />
      <DropdownMenuContent align="end" sideOffset={8} className="w-80">
        <DropdownMenuLabel>Chamados de suporte</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {alerts.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            Nenhuma atualização pendente.
          </p>
        ) : (
          <>
            {alerts.slice(0, 8).map((alert) => (
              <DropdownMenuItem
                key={alert.id}
                render={
                  <Link
                    href={`/dashboard/suporte/${alert.ticketId}`}
                    onClick={() => dismissAlert(alert.id)}
                  />
                }
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{alert.title}</span>
                  <span className="text-xs text-muted-foreground">{alert.body}</span>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={dismissAllAlerts}>Limpar</DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/dashboard/suporte" />}>
          Ver todos os chamados
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
