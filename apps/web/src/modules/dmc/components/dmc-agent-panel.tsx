"use client";

import { Button } from "@econmesh-admin/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@econmesh-admin/ui/components/card";
import { Input } from "@econmesh-admin/ui/components/input";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { dmcAdminService, type DmcAgentDetail, type DmcTicket } from "@/services/dmc/dmc.service";
import { ApiError } from "@/utils/errors";

export function DmcAgentPanel({ userId }: { userId: string }) {
  const [detail, setDetail] = useState<DmcAgentDetail | null>(null);
  const [tickets, setTickets] = useState<DmcTicket[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [source, setSource] = useState<"assigned" | "registered">("assigned");

  async function load() {
    const [agent, assigned] = await Promise.all([
      dmcAdminService.agent(userId),
      dmcAdminService.agentTickets(userId),
    ]);
    setDetail(agent);
    setTickets(assigned.items);
  }

  useEffect(() => {
    void load().catch(() => setDetail(null));
  }, [userId]);

  if (!detail) return null;

  async function link() {
    try {
      await dmcAdminService.linkCompany(userId, companyId.trim(), source);
      setCompanyId("");
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Não foi possível vincular.");
    }
  }

  async function unlink(id: string) {
    try {
      await dmcAdminService.unlinkCompany(userId, id);
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Não foi possível desvincular.");
    }
  }

  async function availability(available: boolean) {
    await dmcAdminService.setAvailability(userId, available);
    await load();
  }

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle>Carteira do Agente DMC</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p>
          {detail.available ? "Disponível" : "Indisponível"} · posição {detail.queue_position} ·{" "}
          {detail.open_count} pendentes · {detail.in_progress_count} em atendimento
        </p>
        <Button type="button" size="sm" variant="outline" onClick={() => void availability(!detail.available)}>
          {detail.available ? "Marcar indisponível" : "Marcar disponível"}
        </Button>
        <div className="flex flex-wrap gap-2">
          <Input
            value={companyId}
            onChange={(event) => setCompanyId(event.target.value)}
            placeholder="ID da empresa"
            className="max-w-sm"
          />
          <select
            className="h-10 rounded-md border bg-background px-2"
            value={source}
            onChange={(event) => setSource(event.target.value as "assigned" | "registered")}
          >
            <option value="assigned">Atribuída</option>
            <option value="registered">Cadastrada pelo agente</option>
          </select>
          <Button type="button" onClick={() => void link()}>
            Vincular
          </Button>
        </div>
        {detail.companies.map((company) => (
          <div key={company.id} className="flex items-center justify-between gap-2">
            <span>
              {company.trade_name || company.legal_name} · {company.source}
            </span>
            <Button type="button" size="sm" variant="outline" onClick={() => void unlink(company.id)}>
              Desvincular
            </Button>
          </div>
        ))}
        <div>
          <p className="mb-2 font-medium">Atendimentos</p>
          {tickets.map((ticket) => (
            <p key={ticket.id}>
              #{ticket.ticket_number} {ticket.subject} · {ticket.status}
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
