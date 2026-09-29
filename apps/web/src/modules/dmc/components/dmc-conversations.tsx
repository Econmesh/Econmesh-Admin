"use client";

import { Button } from "@econmesh-admin/ui/components/button";
import { Input } from "@econmesh-admin/ui/components/input";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { dmcAgentService, type DmcConversation, type DmcMessage } from "@/services/dmc/dmc.service";
import { ApiError } from "@/utils/errors";

export function DmcConversationsView() {
  const [items, setItems] = useState<DmcConversation[]>([]);
  const [userId, setUserId] = useState("");
  const [opening, setOpening] = useState("");

  async function load() {
    const data = await dmcAgentService.conversations();
    setItems(data.items);
  }

  useEffect(() => {
    void load();
  }, []);

  async function start() {
    if (!userId.trim() || !opening.trim()) return;
    try {
      await dmcAgentService.openConversation(userId.trim(), opening.trim());
      setUserId("");
      setOpening("");
      toast.success("Conversa aberta.");
      await load();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Não foi possível abrir a conversa.",
      );
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Conversas</h1>
        <p className="text-sm text-muted-foreground">
          Canal direto com usuários das empresas da sua carteira.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Input
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
          placeholder="ID do usuário da carteira"
          className="max-w-xs"
        />
        <Input
          value={opening}
          onChange={(event) => setOpening(event.target.value)}
          placeholder="Mensagem inicial"
          className="max-w-md"
        />
        <Button type="button" onClick={() => void start()}>
          Iniciar conversa
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma conversa aberta.</p>
      ) : (
        items.map((item) => (
          <Link
            key={item.id}
            href={`/dashboard/conversas/${item.id}`}
            className="block rounded-xl border px-4 py-3 hover:bg-accent"
          >
            <p className="font-medium">{item.user_name ?? "Usuário"}</p>
            <p className="text-sm text-muted-foreground">
              {item.company_name} · {item.last_message_preview ?? "Sem mensagens"}
            </p>
          </Link>
        ))
      )}
    </div>
  );
}

export function DmcConversationThread({ conversationId }: { conversationId: string }) {
  const [messages, setMessages] = useState<DmcMessage[]>([]);
  const [body, setBody] = useState("");

  async function load() {
    const data = await dmcAgentService.messages(conversationId);
    setMessages(data.items);
  }

  useEffect(() => {
    void load();
  }, [conversationId]);

  async function send() {
    if (!body.trim()) return;
    try {
      await dmcAgentService.sendMessage(conversationId, body.trim());
      setBody("");
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Não foi possível enviar.");
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Conversa</h1>
      <div className="space-y-2">
        {messages.map((message) => (
          <div key={message.id} className="rounded-lg border px-3 py-2 text-sm">
            <p className="text-xs text-muted-foreground">
              {message.author_name ?? message.author_role}
            </p>
            <p>{message.body}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={body} onChange={(event) => setBody(event.target.value)} placeholder="Mensagem" />
        <Button type="button" onClick={() => void send()}>
          Enviar
        </Button>
      </div>
    </div>
  );
}
