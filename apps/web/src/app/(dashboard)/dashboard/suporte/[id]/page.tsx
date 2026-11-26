"use client";

import { useParams } from "next/navigation";

import { useAuth } from "@/hooks/use-auth";
import { DmcSupportThread } from "@/modules/dmc/components/dmc-support";
import { SupportTicketDetailView } from "@/modules/support/components/support-ticket-detail";

export default function SuporteDetailPage() {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  if (user?.role === "dmc_agent") return <DmcSupportThread ticketId={params.id} />;
  return <SupportTicketDetailView ticketId={params.id} />;
}
