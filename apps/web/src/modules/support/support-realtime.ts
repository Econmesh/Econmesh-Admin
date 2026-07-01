import type { SupportMessage } from "@/types/api";
import type { SupportStreamEvent } from "@/services/admin/support.service";

export function normalizeStreamMessage(raw: Record<string, unknown>): SupportMessage {
  return {
    id: String(raw.id),
    ticket_id: String(raw.ticket_id),
    author_id: String(raw.author_id),
    author_role: raw.author_role as SupportMessage["author_role"],
    author_name: (raw.author_name as string | null) ?? null,
    message_type: raw.message_type as SupportMessage["message_type"],
    body: String(raw.body),
    read_at: (raw.read_at as string | null) ?? null,
    created_at: String(raw.created_at),
  };
}

export function applySupportStreamEvent(
  event: SupportStreamEvent,
  messages: SupportMessage[],
): SupportMessage[] | null {
  if (event.type === "message_created" && event.data?.message) {
    const msg = normalizeStreamMessage(event.data.message as Record<string, unknown>);
    if (messages.some((m) => m.id === msg.id)) return null;
    return [...messages, msg].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
  }

  if (event.type === "messages_read" && event.data?.message_ids) {
    const ids = new Set((event.data.message_ids as string[]).map(String));
    const readAt = new Date().toISOString();
    return messages.map((m) => (ids.has(m.id) ? { ...m, read_at: m.read_at ?? readAt } : m));
  }

  return null;
}

export function ticketIdFromEvent(event: SupportStreamEvent): string | undefined {
  const id = event.data?.ticket_id;
  return id != null ? String(id) : undefined;
}
