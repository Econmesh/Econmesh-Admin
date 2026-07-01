"use client";

import { cn } from "@econmesh-admin/ui/lib/utils";
import { Check, CheckCheck } from "lucide-react";
import type { SupportMessage } from "@/types/api";

type Props = {
  messages: SupportMessage[];
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SupportMessageThread({ messages }: Props) {
  if (messages.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma mensagem.</p>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {messages.map((msg) => {
        const isUser = msg.message_type === "user_message";
        const isInternal = msg.message_type === "internal_note";
        const isAdmin = msg.message_type === "admin_reply";

        return (
          <div
            key={msg.id}
            className={cn(
              "flex",
              isInternal ? "justify-center" : isUser ? "justify-start" : "justify-end",
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                isInternal &&
                  "rounded-md border border-amber-300/60 bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-50",
                isUser && "rounded-bl-md bg-muted",
                isAdmin &&
                  "rounded-br-md bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-50",
              )}
            >
              {isInternal && (
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                  Nota interna — só admins
                </p>
              )}
              {msg.author_name && !isInternal && (
                <p className="mb-1 text-xs font-semibold opacity-80">{msg.author_name}</p>
              )}
              {isInternal && msg.author_name && (
                <p className="mb-1 text-xs font-semibold opacity-70">{msg.author_name}</p>
              )}
              <p className="whitespace-pre-wrap break-words">{msg.body}</p>
              <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-60">
                <span>{formatTime(msg.created_at)}</span>
                {isAdmin && (
                  <span
                    className="inline-flex items-center gap-0.5"
                    title={msg.read_at ? "Lida pelo cliente" : "Enviada"}
                  >
                    {msg.read_at ? (
                      <CheckCheck className="size-3 text-sky-600" aria-label="Lida" />
                    ) : (
                      <Check className="size-3" aria-label="Enviada" />
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
