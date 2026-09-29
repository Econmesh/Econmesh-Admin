"use client";

import { useParams } from "next/navigation";

import { useAuth } from "@/hooks/use-auth";
import { AdminConversationDetailView } from "@/modules/conversations/components/admin-conversation-detail";
import { DmcConversationThread } from "@/modules/dmc/components/dmc-conversations";

export default function ConversaDetailPage() {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  if (user?.role === "dmc_agent") {
    return <DmcConversationThread conversationId={params.id} />;
  }
  return <AdminConversationDetailView conversationId={params.id} />;
}
