"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@econmesh-admin/ui/components/card";
import { Skeleton } from "@econmesh-admin/ui/components/skeleton";
import Link from "next/link";
import { useEffect, useState } from "react";

import { dmcAgentService, type DmcDashboard } from "@/services/dmc/dmc.service";

export function DmcDashboardView() {
  const [data, setData] = useState<DmcDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void dmcAgentService
      .dashboard()
      .then(setData)
      .catch(() => setError("Não foi possível carregar o dashboard."));
  }, []);

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Área DMC</h1>
        <p className="text-sm text-muted-foreground">
          Indicadores da sua carteira e dos atendimentos atribuídos a você.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.indicators.map((indicator) => (
          <Card key={indicator.key} className="rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {indicator.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{indicator.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Atendimentos recentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.recent_tickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum atendimento atribuído.</p>
          ) : (
            data.recent_tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/dashboard/suporte/${ticket.id}`}
                className="block rounded-lg border px-3 py-2 text-sm hover:bg-accent"
              >
                <span className="font-medium">#{String(ticket.ticket_number).padStart(4, "0")}</span>{" "}
                {ticket.subject}
                <span className="ml-2 text-muted-foreground">{ticket.status}</span>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
