"use client";

import { cn } from "@econmesh-admin/ui/lib/utils";
import { useEffect, useRef } from "react";

import type { ConversationMessage } from "@/types/api";

type Props = {
  messages: ConversationMessage[];
  autoScroll?: boolean;
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminConversationMessageThread({ messages, autoScroll }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(messages.length);

  useEffect(() => {
    if (!autoScroll) return;
    if (messages.length >= prevCountRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevCountRef.current = messages.length;
  }, [messages, autoScroll]);

  if (messages.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma mensagem.</p>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {messages.map((msg) => {
        const isInternal = msg.message_type === "internal_note";
        const isOfferer = msg.author_role === "offerer";

        return (
          <div
            key={msg.id}
            className={cn(
              "flex",
              isInternal ? "justify-center" : isOfferer ? "justify-start" : "justify-end",
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                isInternal &&
                  "rounded-md border border-amber-300/60 bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-50",
                !isInternal && isOfferer && "rounded-bl-md bg-muted",
                !isInternal &&
                  !isOfferer &&
                  "rounded-br-md bg-sky-100 text-sky-950 dark:bg-sky-950 dark:text-sky-50",
              )}
            >
              {isInternal && (
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                  Nota interna — só admins
                </p>
              )}
              {msg.author_name && (
                <p className="mb-1 text-xs font-semibold opacity-80">{msg.author_name}</p>
              )}
              <p className="whitespace-pre-wrap break-words">{msg.body}</p>
              <p className="mt-1 text-right text-[10px] opacity-60">
                {formatTime(msg.created_at)}
              </p>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} aria-hidden />
    </div>
  );
}
