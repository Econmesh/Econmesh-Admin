"use client";

import { Button } from "@econmesh-admin/ui/components/button";
import { Input } from "@econmesh-admin/ui/components/input";
import { Skeleton } from "@econmesh-admin/ui/components/skeleton";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { useConversations } from "@/contexts/conversations-context";
import { AdminConversationList } from "@/modules/conversations/components/admin-conversation-list";
import { adminConversationsService } from "@/services/admin/conversations.service";
import type { Conversation, ConversationStatus } from "@/types/api";
import { ApiError } from "@/utils/errors";

const FILTERS: { label: string; value: ConversationStatus | "all" }[] = [
  { label: "Todas", value: "all" },
  { label: "Abertas", value: "open" },
  { label: "Encerradas", value: "closed" },
];

export default function AdminConversasPage() {
  const { subscribeGlobal, refreshSignal } = useConversations();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ConversationStatus | "all">("all");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminConversationsService.list({
        page: 1,
        page_size: 100,
        status: filter === "all" ? undefined : filter,
        q: search || undefined,
      });
      setConversations(data.items);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Não foi possível carregar as conversas.",
      );
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    void load();
  }, [load, refreshSignal]);

  useEffect(() => {
    return subscribeGlobal(() => {
      void load();
    });
  }, [subscribeGlobal, load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Conversas</h1>
        <p className="text-sm text-muted-foreground">
          Monitore as conversas entre empresas nas oportunidades e deixe notas internas.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <form
        className="flex max-w-md gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(q.trim());
        }}
      >
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por oportunidade ou empresa..."
        />
        <Button type="submit" variant="outline">
          Buscar
        </Button>
      </form>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : (
        <AdminConversationList conversations={conversations} />
      )}
    </div>
  );
}
