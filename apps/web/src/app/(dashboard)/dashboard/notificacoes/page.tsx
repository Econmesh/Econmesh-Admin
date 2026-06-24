"use client";

import { Bell } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";

export default function NotificacoesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Notificações</h1>
        <p className="text-sm text-muted-foreground">
          Envio e gestão de notificações da plataforma.
        </p>
      </div>
      <EmptyState
        icon={Bell}
        title="Módulo em desenvolvimento"
        description="A gestão de notificações será disponibilizada em breve."
      />
    </div>
  );
}
