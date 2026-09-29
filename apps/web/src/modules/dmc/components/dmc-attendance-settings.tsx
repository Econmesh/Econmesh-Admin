"use client";

import { Button } from "@econmesh-admin/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@econmesh-admin/ui/components/card";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { dmcAdminService, type AuditEvent, type DmcQueue } from "@/services/dmc/dmc.service";
import { ApiError } from "@/utils/errors";

export function DmcAttendanceSettings() {
  const [queue, setQueue] = useState<DmcQueue | null>(null);
  const [audit, setAudit] = useState<AuditEvent[]>([]);

  async function load() {
    const [current, events] = await Promise.all([dmcAdminService.queue(), dmcAdminService.audit()]);
    setQueue(current);
    setAudit(events.items.slice(0, 8));
  }

  useEffect(() => {
    void load().catch(() => toast.error("Não foi possível carregar o atendimento DMC."));
  }, []);

  if (!queue) return null;

  const orderLabel = queue.agents.map((agent) => agent.name ?? agent.email ?? "Agente").join(" → ");
  const nextAgent = queue.agents.find((agent) => agent.user_id === queue.next_agent_user_id);

  async function setMode(mode: "manual" | "round_robin") {
    try {
      setQueue(await dmcAdminService.setMode(mode));
      toast.success("Modo de distribuição atualizado.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Falha ao salvar o modo.");
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const next = [...queue!.agents];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item!);
    try {
      setQueue(await dmcAdminService.reorder(next.map((agent) => agent.user_id)));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Falha ao reordenar.");
    }
  }

  async function toggleAvailability(userId: string, available: boolean) {
    try {
      await dmcAdminService.setAvailability(userId, available);
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Falha ao alterar disponibilidade.");
    }
  }

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle>Atendimento DMC</CardTitle>
        <CardDescription>
          Distribuição das solicitações de Diagnóstico de Maturidade Circular.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={queue.mode === "manual" ? "default" : "outline"}
            onClick={() => void setMode("manual")}
          >
            Manual
          </Button>
          <Button
            type="button"
            size="sm"
            variant={queue.mode === "round_robin" ? "default" : "outline"}
            onClick={() => void setMode("round_robin")}
          >
            Automática — fila sequencial
          </Button>
        </div>
        <p className="text-sm">
          Fila atual: {orderLabel || "Nenhum agente cadastrado"}
        </p>
        <p className="text-sm text-muted-foreground">
          Próximo: {nextAgent ? (nextAgent.name ?? nextAgent.email) : "Nenhum agente disponível"}
        </p>
        <div className="space-y-2">
          {queue.agents.map((agent, index) => (
            <div key={agent.user_id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
              <div>
                <p className="font-medium">{agent.name ?? agent.email}</p>
                <p className="text-muted-foreground">
                  {agent.is_active ? "Ativo" : "Inativo"} · {agent.available ? "Disponível" : "Indisponível"} ·{" "}
                  {agent.open_count} pendentes · {agent.in_progress_count} em atendimento
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => void move(index, -1)}>
                  Subir
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => void move(index, 1)}>
                  Descer
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void toggleAvailability(agent.user_id, !agent.available)}
                >
                  {agent.available ? "Indisponível" : "Disponível"}
                </Button>
              </div>
            </div>
          ))}
        </div>
        {audit.length > 0 ? (
          <div className="space-y-1 text-xs text-muted-foreground">
            {audit.map((event) => (
              <p key={event.id}>
                {new Date(event.created_at).toLocaleString("pt-BR")} · {event.action}
              </p>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
