import { env } from "@econmesh-admin/env/web";

import { API_V1_PREFIX } from "@/lib/constants";
import type {
  ConversationDetail,
  ConversationListResponse,
  ConversationMessage,
  ConversationMessageListResponse,
  ConversationStatus,
} from "@/types/api";
import { api, type TokenProvider } from "@/services/api/client";

function buildQuery(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export type ConversationStreamEventType =
  | "conversation_created"
  | "message_created"
  | "messages_read"
  | "presence_changed"
  | "ping";

export type ConversationStreamEvent = {
  type: ConversationStreamEventType;
  data?: Record<string, unknown>;
};

async function* parseSseStream(
  response: Response,
): AsyncGenerator<{ eventType: string; data: Record<string, unknown> }> {
  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";
      for (const part of parts) {
        const lines = part.split("\n");
        let eventType = "message";
        let dataLine = "";
        for (const line of lines) {
          if (line.startsWith("event:")) eventType = line.slice(6).trim();
          else if (line.startsWith("data:")) dataLine = line.slice(5).trim();
        }
        if (!dataLine) {
          yield { eventType, data: {} };
          continue;
        }
        try {
          yield { eventType, data: JSON.parse(dataLine) as Record<string, unknown> };
        } catch {
          yield { eventType, data: {} };
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

async function* openConversationStream(
  path: string,
  getToken: TokenProvider,
  signal?: AbortSignal,
): AsyncGenerator<ConversationStreamEvent> {
  const base = env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  const token = await getToken();
  if (!token) throw new Error("missing_auth_token");

  const response = await fetch(`${base}${API_V1_PREFIX}${path}`, {
    headers: {
      Accept: "text/event-stream",
      Authorization: `Bearer ${token}`,
      "Cache-Control": "no-cache",
    },
    signal,
    cache: "no-store",
  });

  if (!response.ok || !response.body) {
    throw new Error(`stream_failed_${response.status}`);
  }

  for await (const { eventType, data } of parseSseStream(response)) {
    if (eventType === "ping") {
      yield { type: "ping" };
      continue;
    }
    yield {
      type: eventType as ConversationStreamEventType,
      data,
    };
  }
}

export const adminConversationsService = {
  list(
    params: {
      page?: number;
      page_size?: number;
      status?: ConversationStatus;
      q?: string;
    } = {},
  ) {
    return api.get<ConversationListResponse>(
      `/admin/conversations${buildQuery(params)}`,
      { auth: true },
    );
  },

  get(conversationId: string) {
    return api.get<ConversationDetail>(`/admin/conversations/${conversationId}`, {
      auth: true,
    });
  },

  listMessages(conversationId: string) {
    return api.get<ConversationMessageListResponse>(
      `/admin/conversations/${conversationId}/messages`,
      { auth: true },
    );
  },

  addNote(conversationId: string, body: string) {
    return api.post<ConversationMessage>(
      `/admin/conversations/${conversationId}/notes`,
      { body },
      { auth: true },
    );
  },

  async *stream(
    getToken: TokenProvider,
    signal?: AbortSignal,
  ): AsyncGenerator<ConversationStreamEvent> {
    yield* openConversationStream("/admin/conversations/stream", getToken, signal);
  },

  async *conversationStream(
    conversationId: string,
    getToken: TokenProvider,
    signal?: AbortSignal,
  ): AsyncGenerator<ConversationStreamEvent> {
    yield* openConversationStream(
      `/admin/conversations/${conversationId}/stream`,
      getToken,
      signal,
    );
  },
};
