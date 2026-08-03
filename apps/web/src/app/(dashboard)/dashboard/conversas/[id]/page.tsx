import { AdminConversationDetailView } from "@/modules/conversations/components/admin-conversation-detail";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminConversaDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <AdminConversationDetailView conversationId={id} />;
}
