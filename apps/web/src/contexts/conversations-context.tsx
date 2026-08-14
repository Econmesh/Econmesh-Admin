"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "@/hooks/use-auth";
import {
  conversationIdFromEvent,
  normalizeConversationId,
} from "@/modules/conversations/conversation-realtime";
import {
  adminConversationsService,
  type ConversationStreamEvent,
} from "@/services/admin/conversations.service";

const STREAM_RETRY_MS = 3_000;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

type ConversationListener = (event: ConversationStreamEvent) => void;
type GlobalListener = () => void;

type ConversationsContextValue = {
  subscribeConversation: (
    conversationId: string,
    listener: ConversationListener,
  ) => () => void;
  subscribeGlobal: (listener: GlobalListener) => () => void;
  refreshSignal: number;
};

const ConversationsContext = createContext<ConversationsContextValue | null>(null);

export function ConversationsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user, getIdToken } = useAuth();
  const [refreshSignal, setRefreshSignal] = useState(0);
  const listenersRef = useRef<Map<string, Set<ConversationListener>>>(new Map());
  const globalListenersRef = useRef<Set<GlobalListener>>(new Set());

  const subscribeConversation = useCallback(
    (conversationId: string, listener: ConversationListener) => {
      const key = normalizeConversationId(conversationId);
      const map = listenersRef.current;
      if (!map.has(key)) map.set(key, new Set());
      map.get(key)!.add(listener);
      return () => map.get(key)?.delete(listener);
    },
    [],
  );

  const subscribeGlobal = useCallback((listener: GlobalListener) => {
    globalListenersRef.current.add(listener);
    return () => globalListenersRef.current.delete(listener);
  }, []);

  const notifyGlobal = useCallback(() => {
    setRefreshSignal((n) => n + 1);
    globalListenersRef.current.forEach((l) => l());
  }, []);

  const handleEventRef = useRef<(event: ConversationStreamEvent) => void>(() => {});

  handleEventRef.current = (event: ConversationStreamEvent) => {
    if (event.type === "ping") return;

    const conversationId = conversationIdFromEvent(event);
    if (conversationId) {
      listenersRef.current
        .get(normalizeConversationId(conversationId))
        ?.forEach((listener) => listener(event));
    }

    if (
      event.type === "conversation_created" ||
      event.type === "message_created"
    ) {
      notifyGlobal();
    }
  };

  useEffect(() => {
    if (!isAuthenticated || isLoading || !user) return;

    const controller = new AbortController();
    let retryDelay = STREAM_RETRY_MS;

    async function connectStream() {
      while (!controller.signal.aborted) {
        try {
          for await (const event of adminConversationsService.stream(
            () => getIdToken(),
            controller.signal,
          )) {
            retryDelay = STREAM_RETRY_MS;
            handleEventRef.current(event);
          }
        } catch {
          if (controller.signal.aborted) break;
        }

        if (controller.signal.aborted) break;
        await sleep(retryDelay);
        retryDelay = Math.min(retryDelay * 1.5, 30_000);
      }
    }

    void connectStream();
    return () => controller.abort();
  }, [isAuthenticated, isLoading, user, getIdToken]);

  const value = useMemo(
    () => ({
      subscribeConversation,
      subscribeGlobal,
      refreshSignal,
    }),
    [subscribeConversation, subscribeGlobal, refreshSignal],
  );

  return (
    <ConversationsContext.Provider value={value}>
      {children}
    </ConversationsContext.Provider>
  );
}

export function useConversations() {
  const context = useContext(ConversationsContext);
  if (!context) {
    throw new Error("useConversations must be used within ConversationsProvider");
  }
  return context;
}
