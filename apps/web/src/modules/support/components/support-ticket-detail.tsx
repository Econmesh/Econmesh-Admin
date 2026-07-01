"use client";

import { Badge } from "@econmesh-admin/ui/components/badge";
import { Button } from "@econmesh-admin/ui/components/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@econmesh-admin/ui/components/tabs";
import { Textarea } from "@econmesh-admin/ui/components/textarea";
import { MessageSquare, StickyNote } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useSupport } from "@/contexts/support-context";
import { SupportMessageThread } from "@/modules/support/components/support-message-thread";
import { UserOnlineBadge } from "@/modules/support/components/user-online-badge";
import { SUPPORT_STATUS_LABELS } from "@/modules/support/schemas";
import { applySupportStreamEvent } from "@/modules/support/support-realtime";
import {
  adminSupportService,
  formatTicketNumber,
} from "@/services/admin/support.service";
import type { SupportMessage, SupportTicketDetail } from "@/types/api";
import { ApiError } from "@/utils/errors";

type Props = {
  ticketId: string;
};

type ComposerMode = "reply" | "note";

export function SupportTicketDetailView({ ticketId }: Props) {
  const { subscribeTicket, subscribePresence, dismissAlertsForTicket } = useSupport();
  const [ticket, setTicket] = useState<SupportTicketDetail | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [composerMode, setComposerMode] = useState<ComposerMode>("reply");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [reopening, setReopening] = useState(false);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const loadTicket = useCallback(async () => {
    const t = await adminSupportService.get(ticketId);
    setTicket(t);
    return t;
  }, [ticketId]);

  const loadMessages = useCallback(async (markRead = false) => {
    if (markRead) {
      const m = await adminSupportService.markMessagesRead(ticketId);
      setMessages(m.items);
      return;
    }
    const m = await adminSupportService.listMessages(ticketId);
    setMessages(m.items);
  }, [ticketId]);

  const load = useCallback(async () => {
    try {
      await loadTicket();
      await loadMessages(true);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Não foi possível carregar o chamado.",
      );
    } finally {
      setLoading(false);
    }
  }, [loadTicket, loadMessages]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    dismissAlertsForTicket(ticketId);
  }, [ticketId, dismissAlertsForTicket]);

  useEffect(() => {
    if (!ticket?.user_id) return;
    return subscribePresence(ticket.user_id, (online) => {
      setTicket((prev) => (prev ? { ...prev, user_online: online } : prev));
    });
  }, [ticket?.user_id, subscribePresence]);

  useEffect(() => {
    return subscribeTicket(ticketId, (event) => {
      if (event.type === "message_created" || event.type === "messages_read") {
        const next = applySupportStreamEvent(event, messagesRef.current);
        if (next) {
          setMessages(next);
          return;
        }
      }
      if (
        event.type === "message_created" ||
        event.type === "ticket_closed" ||
        event.type === "ticket_reopened" ||
        event.type === "messages_read"
      ) {
        void loadTicket();
        if (event.type !== "messages_read") {
          void loadMessages(true);
        }
      }
    });
  }, [ticketId, subscribeTicket, loadTicket, loadMessages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      const sent =
        composerMode === "reply"
          ? await adminSupportService.reply(ticketId, text.trim())
          : await adminSupportService.addNote(ticketId, text.trim());
      setText("");
      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        return [...prev, sent];
      });
      if (composerMode === "note") {
        setComposerMode("reply");
      }
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Não foi possível enviar.",
      );
    } finally {
      setSending(false);
    }
  }

  async function handleClose() {
    if (!confirm("Encerrar este atendimento?")) return;
    setClosing(true);
    try {
      const updated = await adminSupportService.close(ticketId);
      setTicket((prev) => (prev ? { ...prev, ...updated } : updated));
      toast.success("Chamado encerrado.");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Não foi possível encerrar o chamado.",
      );
    } finally {
      setClosing(false);
    }
  }

  async function handleReopen() {
    setReopening(true);
    try {
      const updated = await adminSupportService.reopen(ticketId);
      setTicket((prev) => (prev ? { ...prev, ...updated } : updated));
      toast.success("Chamado reaberto.");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Não foi possível reabrir o chamado.",
      );
    } finally {
      setReopening(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  if (!ticket) {
    return (
      <p className="text-sm text-muted-foreground">
        Chamado não encontrado.{" "}
        <Link href="/dashboard/suporte" className="underline">
          Voltar
        </Link>
      </p>
    );
  }

  const isClosed = ticket.status === "closed";
  const isNoteMode = composerMode === "note";

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        <Link href="/dashboard/suporte" className="hover:text-foreground">
          Suporte
        </Link>
        {" / "}
        <span>{formatTicketNumber(ticket.ticket_number)}</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {formatTicketNumber(ticket.ticket_number)} — {ticket.subject}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {ticket.user_name ?? "Usuário"} · {ticket.user_email}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <UserOnlineBadge online={ticket.user_online ?? false} />
          <Badge variant={isClosed ? "secondary" : "default"}>
            {SUPPORT_STATUS_LABELS[ticket.status] ?? ticket.status}
          </Badge>
          {isClosed ? (
            <Button size="sm" onClick={handleReopen} disabled={reopening}>
              {reopening ? "Reabrindo..." : "Reabrir chamado"}
            </Button>
          ) : (
            <Button variant="destructive" size="sm" onClick={handleClose} disabled={closing}>
              {closing ? "Encerrando..." : "Encerrar atendimento"}
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="messages">
        <TabsList>
          <TabsTrigger value="messages">Mensagens</TabsTrigger>
        </TabsList>
        <TabsContent value="messages">
          <div className="flex min-h-[480px] flex-col overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex-1 overflow-y-auto">
              <SupportMessageThread messages={messages} />
            </div>
            {!isClosed && (
              <form
                onSubmit={handleSend}
                className="space-y-2 border-t border-border bg-muted/20 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    {isNoteMode ? "Nota interna (não visível ao cliente)" : "Responder ao cliente"}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setComposerMode((m) => (m === "reply" ? "note" : "reply"));
                      setText("");
                    }}
                  >
                    {isNoteMode ? (
                      <>
                        <MessageSquare className="size-3.5" />
                        Voltar à conversa
                      </>
                    ) : (
                      <>
                        <StickyNote className="size-3.5" />
                        Nota interna
                      </>
                    )}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={
                      isNoteMode
                        ? "Escreva uma nota interna..."
                        : "Responder ao cliente..."
                    }
                    rows={2}
                    className={
                      isNoteMode
                        ? "min-h-[56px] resize-none border-amber-200/60 bg-amber-50/50 dark:bg-amber-950/20"
                        : "min-h-[56px] resize-none"
                    }
                  />
                  <Button
                    type="submit"
                    variant={isNoteMode ? "secondary" : "default"}
                    disabled={sending || !text.trim()}
                    className="self-end"
                  >
                    {sending ? "Enviando..." : isNoteMode ? "Salvar nota" : "Responder"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
