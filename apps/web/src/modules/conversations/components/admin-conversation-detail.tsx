"use client";

import { Badge } from "@econmesh-admin/ui/components/badge";
import { Button } from "@econmesh-admin/ui/components/button";
import { Textarea } from "@econmesh-admin/ui/components/textarea";
import { StickyNote } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AdminConversationMessageThread } from "@/modules/conversations/components/admin-conversation-message-thread";
import { useAdminConversationMessagesRealtime } from "@/modules/conversations/hooks/use-admin-conversation-messages-realtime";
import { messagesFingerprint } from "@/modules/conversations/conversation-realtime";
import { adminConversationsService } from "@/services/admin/conversations.service";
import type { ConversationDetail, ConversationMessage } from "@/types/api";
import { ApiError } from "@/utils/errors";

type Props = {
  conversationId: string;
};

const STATUS_LABELS: Record<string, string> = {
  open: "Aberta",
  closed: "Encerrada",
};

export function AdminConversationDetailView({ conversationId }: Props) {
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesRef = useRef(messages);
  const fingerprintRef = useRef("");
  messagesRef.current = messages;

  const fetchMessages = useCallback(async () => {
    const data = await adminConversationsService.listMessages(conversationId);
    return data.items;
  }, [conversationId]);

  const loadConversation = useCallback(async () => {
    const data = await adminConversationsService.get(conversationId);
    setConversation(data);
    return data;
  }, [conversationId]);

  const load = useCallback(async () => {
    try {
      await loadConversation();
      const items = await fetchMessages();
      fingerprintRef.current = messagesFingerprint(items);
      setMessages(items);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Não foi possível carregar a conversa.",
      );
    } finally {
      setLoading(false);
    }
  }, [loadConversation, fetchMessages]);

  useEffect(() => {
    void load();
  }, [load]);

  useAdminConversationMessagesRealtime({
    conversationId,
    messagesRef,
    setMessages,
    fetchMessages,
    fetchConversation: loadConversation,
  });

  async function handleSendNote(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      const sent = await adminConversationsService.addNote(conversationId, text.trim());
      setText("");
      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        const next = [...prev, sent];
        fingerprintRef.current = messagesFingerprint(next);
        return next;
      });
      toast.success("Nota interna adicionada.");
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Não foi possível salvar a nota.",
      );
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando conversa...</p>;
  }

  if (!conversation) {
    return (
      <p className="text-sm text-muted-foreground">
        Conversa não encontrada.{" "}
        <Link href="/dashboard/conversas" className="text-primary underline">
          Voltar
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/dashboard/conversas"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Voltar às conversas
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">
            {conversation.opportunity_title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {conversation.offerer_company_name}
            {conversation.offerer_user_name
              ? ` (${conversation.offerer_user_name})`
              : ""}{" "}
            × {conversation.interested_company_name}
            {conversation.interested_user_name
              ? ` (${conversation.interested_user_name})`
              : ""}
          </p>
          <Link
            href={`/dashboard/oportunidades/${conversation.opportunity_id}`}
            className="mt-1 inline-block text-xs text-primary hover:underline"
          >
            Ver oportunidade
          </Link>
        </div>
        <Badge variant={conversation.status === "closed" ? "secondary" : "default"}>
          {STATUS_LABELS[conversation.status] ?? conversation.status}
        </Badge>
      </div>

      <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex-1 overflow-y-auto">
          <AdminConversationMessageThread messages={messages} autoScroll />
        </div>
        <form
          onSubmit={handleSendNote}
          className="space-y-2 border-t border-border bg-amber-50/40 p-3 dark:bg-amber-950/20"
        >
          <p className="flex items-center gap-1.5 text-xs font-medium text-amber-800 dark:text-amber-200">
            <StickyNote className="size-3.5" aria-hidden />
            Nota interna (visível apenas para admins)
          </p>
          <div className="flex gap-2">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Adicionar observação interna..."
              rows={2}
              className="min-h-[60px] resize-none border-amber-200 bg-background"
              maxLength={5000}
            />
            <Button
              type="submit"
              disabled={sending || !text.trim()}
              className="self-end"
              variant="outline"
            >
              Salvar nota
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
