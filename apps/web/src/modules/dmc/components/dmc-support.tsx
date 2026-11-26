"use client";

import { Button } from "@econmesh-admin/ui/components/button";
import { Input } from "@econmesh-admin/ui/components/input";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  dmcAgentService,
  type DmcSupportMessage,
  type DmcTicket,
} from "@/services/dmc/dmc.service";
import { ApiError } from "@/utils/errors";

const FILTERS = [
  { label: "Todos", value: "" },
  { label: "Pendentes", value: "open" },
  { label: "Em atendimento", value: "in_progress" },
  { label: "Concluídos", value: "closed" },
];

export function DmcSupportList() {
  const [status, setStatus] = useState("");
  const [items, setItems] = useState<DmcTicket[]>([]);

  useEffect(() => {
    void dmcAgentService.tickets(status || undefined).then((data) => setItems(data.items));
  }, [status]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Suporte DMC</h1>
        <p className="text-sm text-muted-foreground">Somente solicitações atribuídas a você.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Button
            key={filter.label}
            type="button"
            size="sm"
            variant={status === filter.value ? "default" : "outline"}
            onClick={() => setStatus(filter.value)}
          >
            {filter.label}
          </Button>
        ))}
      </div>
      {items.map((ticket) => (
        <Link
          key={ticket.id}
          href={`/dashboard/suporte/${ticket.id}`}
          className="block rounded-xl border px-4 py-3 hover:bg-accent"
        >
          <p className="font-medium">
            #{String(ticket.ticket_number).padStart(4, "0")} {ticket.subject}
          </p>
          <p className="text-sm text-muted-foreground">
            {ticket.company ?? ticket.visitor_name} · {ticket.status}
          </p>
        </Link>
      ))}
    </div>
  );
}

export function DmcSupportThread({ ticketId }: { ticketId: string }) {
  const [ticket, setTicket] = useState<DmcTicket | null>(null);
  const [messages, setMessages] = useState<DmcSupportMessage[]>([]);
  const [body, setBody] = useState("");

  async function load() {
    const [current, thread] = await Promise.all([
      dmcAgentService.ticket(ticketId),
      dmcAgentService.ticketMessages(ticketId),
    ]);
    setTicket(current);
    setMessages(thread);
  }

  useEffect(() => {
    void load().catch(() => toast.error("Solicitação fora da sua carteira."));
  }, [ticketId]);

  async function reply() {
    try {
      await dmcAgentService.replyTicket(ticketId, body.trim());
      setBody("");
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Não foi possível responder.");
    }
  }

  async function close() {
    try {
      await dmcAgentService.closeTicket(ticketId);
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Não foi possível concluir.");
    }
  }

  if (!ticket) return <p className="text-sm text-muted-foreground">Carregando atendimento…</p>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">
          #{String(ticket.ticket_number).padStart(4, "0")} {ticket.subject}
        </h1>
        <p className="text-sm text-muted-foreground">
          {ticket.visitor_name} · {ticket.visitor_email} · {ticket.company}
        </p>
      </div>
      <div className="space-y-2">
        {messages.map((message) => (
          <div key={message.id} className="rounded-lg border px-3 py-2 text-sm">
            <p className="text-xs text-muted-foreground">{message.author_name ?? message.author_role}</p>
            <p>{message.body}</p>
          </div>
        ))}
      </div>
      {ticket.status !== "closed" ? (
        <div className="flex flex-wrap gap-2">
          <Input value={body} onChange={(event) => setBody(event.target.value)} placeholder="Resposta" />
          <Button type="button" onClick={() => void reply()}>
            Responder
          </Button>
          <Button type="button" variant="outline" onClick={() => void close()}>
            Concluir
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Atendimento concluído.</p>
      )}
    </div>
  );
}
