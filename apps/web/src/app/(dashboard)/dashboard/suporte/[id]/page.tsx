import { SupportTicketDetailView } from "@/modules/support/components/support-ticket-detail";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminSuporteDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <SupportTicketDetailView ticketId={id} />;
}
