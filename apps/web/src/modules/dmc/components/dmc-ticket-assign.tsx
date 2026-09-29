"use client";

import { Button } from "@econmesh-admin/ui/components/button";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { dmcAdminService, type DmcQueueAgent } from "@/services/dmc/dmc.service";
import type { SupportTicket } from "@/types/api";
import { ApiError } from "@/utils/errors";

export function DmcTicketAssignBox({
  ticket,
  onAssigned,
}: {
  ticket: SupportTicket;
  onAssigned: () => void;
}) {
  const [agents, setAgents] = useState<DmcQueueAgent[]>([]);
  const [agentId, setAgentId] = useState(ticket.assigned_agent_id ?? "");

  useEffect(() => {
    void dmcAdminService.queue().then((queue) => setAgents(queue.agents));
  }, []);

  async function assign() {
    if (!agentId) return;
    try {
      await dmcAdminService.assignTicket(ticket.id, agentId);
      toast.success("Solicitação atribuída ao agente.");
      onAssigned();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Não foi possível atribuir.");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 text-sm">
      <span>
        Agente DMC: {ticket.assigned_agent_name ?? "não atribuído"}
      </span>
      <select
        className="h-9 rounded-md border bg-background px-2"
        value={agentId}
        onChange={(event) => setAgentId(event.target.value)}
      >
        <option value="">Selecionar agente</option>
        {agents.map((agent) => (
          <option key={agent.user_id} value={agent.user_id}>
            {agent.name ?? agent.email} · {agent.available ? "disponível" : "indisponível"}
          </option>
        ))}
      </select>
      <Button type="button" size="sm" onClick={() => void assign()}>
        {ticket.assigned_agent_id ? "Reatribuir" : "Atribuir"}
      </Button>
    </div>
  );
}
