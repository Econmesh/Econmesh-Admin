"use client";

import { Button } from "@econmesh-admin/ui/components/button";
import { Skeleton } from "@econmesh-admin/ui/components/skeleton";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { useSupport } from "@/contexts/support-context";
import { SupportTicketList } from "@/modules/support/components/support-ticket-list";
import { adminSupportService } from "@/services/admin/support.service";
import type { SupportTicket, SupportTicketSource, SupportTicketStatus } from "@/types/api";
import { ApiError } from "@/utils/errors";

const STATUS_FILTERS: { label: string; value: SupportTicketStatus | "all" }[] = [
  { label: "Todos", value: "all" },
  { label: "Abertos", value: "open" },
  { label: "Em atendimento", value: "in_progress" },
  { label: "Encerrados", value: "closed" },
];

const SOURCE_FILTERS: { label: string; value: SupportTicketSource | "all" }[] = [
  { label: "Todas as origens", value: "all" },
  { label: "Suporte Interno", value: "internal" },
  { label: "Suporte Externo", value: "external" },
  { label: "Solicitação de Contato", value: "contact_request" },
];

export default function SuportePage() {
  const { subscribeGlobal, refreshSignal } = useSupport();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<SupportTicketStatus | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<SupportTicketSource | "all">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminSupportService.list({
        page: 1,
        page_size: 100,
        status: statusFilter === "all" ? undefined : statusFilter,
        source: sourceFilter === "all" ? undefined : sourceFilter,
      });
      setTickets(data.items);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Não foi possível carregar os chamados.",
      );
    } finally {
      setLoading(false);
    }
  }, [sourceFilter, statusFilter]);

  useEffect(() => {
    void load();
  }, [load, refreshSignal]);

  useEffect(() => {
    return subscribeGlobal(() => {
      void load();
    });
  }, [subscribeGlobal, load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Suporte</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie chamados da plataforma e do site público.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <Button
            key={f.value}
            variant={statusFilter === f.value ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {SOURCE_FILTERS.map((f) => (
          <Button
            key={f.value}
            variant={sourceFilter === f.value ? "default" : "outline"}
            size="sm"
            onClick={() => setSourceFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : (
        <SupportTicketList tickets={tickets} />
      )}
    </div>
  );
}
