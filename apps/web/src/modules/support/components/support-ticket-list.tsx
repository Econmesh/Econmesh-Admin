"use client";

import { Badge } from "@econmesh-admin/ui/components/badge";
import { cn } from "@econmesh-admin/ui/lib/utils";
import Link from "next/link";

import { formatTicketNumber } from "@/services/admin/support.service";
import {
  SUPPORT_STATUS_BADGE_VARIANT,
  SUPPORT_STATUS_LABELS,
} from "@/modules/support/schemas";
import type { SupportTicket } from "@/types/api";

type Props = {
  tickets: SupportTicket[];
};

export function SupportTicketList({ tickets }: Props) {
  if (tickets.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Nenhum chamado encontrado.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => {
        const isOpen = ticket.status === "open";
        const isExternal = ticket.source === "external";
        const isContactRequest = ticket.source === "contact_request";
        const statusVariant =
          SUPPORT_STATUS_BADGE_VARIANT[ticket.status] ?? "warning";

        return (
          <Link
            key={ticket.id}
            href={`/dashboard/suporte/${ticket.id}`}
            className={cn(
              "block rounded-xl border p-4 transition-colors",
              isContactRequest
                ? "border-orange-200 bg-orange-50 hover:bg-orange-100/80 dark:border-orange-800 dark:bg-orange-950/40 dark:hover:bg-orange-950/60"
                : isExternal
                  ? "border-sky-200 bg-sky-50 hover:bg-sky-100/80 dark:border-sky-800 dark:bg-sky-950/40 dark:hover:bg-sky-950/60"
                  : "border-border bg-card hover:bg-muted/40",
              isOpen && "animate-pulse",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">
                  {formatTicketNumber(ticket.ticket_number)}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{ticket.subject}</p>
                  {isContactRequest && (
                    <Badge className="border-transparent bg-orange-500/15 text-xs text-orange-700 dark:text-orange-400">
                      Solicitação de Contato
                    </Badge>
                  )}
                  {isExternal && (
                    <Badge variant="info" className="text-xs">
                      Suporte Externo
                    </Badge>
                  )}
                </div>
              </div>
              <Badge variant={statusVariant}>
                {SUPPORT_STATUS_LABELS[ticket.status] ?? ticket.status}
              </Badge>
            </div>
            {ticket.last_responder_admin_name && (
              <p className="mt-2 text-xs text-muted-foreground">
                Respondido por {ticket.last_responder_admin_name}
              </p>
            )}
          </Link>
        );
      })}
    </div>
  );
}
