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
import { ticketIdFromEvent, normalizeTicketId } from "@/modules/support/support-realtime";
import {
  adminSupportService,
  type SupportStreamEvent,
} from "@/services/admin/support.service";

const STREAM_RETRY_MS = 3_000;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export type SupportAlert = {
  id: string;
  ticketId: string;
  ticketNumber: number;
  title: string;
  body: string;
};

type TicketListener = (event: SupportStreamEvent) => void;
type GlobalListener = () => void;

type SupportContextValue = {
  alerts: SupportAlert[];
  unreadCount: number;
  dismissAlert: (id: string) => void;
  dismissAlertsForTicket: (ticketId: string) => void;
  dismissAllAlerts: () => void;
  subscribeTicket: (ticketId: string, listener: TicketListener) => () => void;
  subscribeGlobal: (listener: GlobalListener) => () => void;
  subscribePresence: (userId: string, listener: (online: boolean) => void) => () => void;
  refreshSignal: number;
};

const SupportContext = createContext<SupportContextValue | null>(null);

export function SupportProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user, getIdToken } = useAuth();

  const [alerts, setAlerts] = useState<SupportAlert[]>([]);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const listenersRef = useRef<Map<string, Set<TicketListener>>>(new Map());
  const globalListenersRef = useRef<Set<GlobalListener>>(new Set());
  const presenceListenersRef = useRef<Map<string, Set<(online: boolean) => void>>>(new Map());

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const dismissAlertsForTicket = useCallback((ticketId: string) => {
    const key = normalizeTicketId(ticketId);
    setAlerts((prev) => prev.filter((a) => normalizeTicketId(a.ticketId) !== key));
  }, []);

  const dismissAllAlerts = useCallback(() => setAlerts([]), []);

  const subscribeTicket = useCallback((ticketId: string, listener: TicketListener) => {
    const key = normalizeTicketId(ticketId);
    const map = listenersRef.current;
    if (!map.has(key)) map.set(key, new Set());
    map.get(key)!.add(listener);
    return () => map.get(key)?.delete(listener);
  }, []);

  const subscribeGlobal = useCallback((listener: GlobalListener) => {
    globalListenersRef.current.add(listener);
    return () => globalListenersRef.current.delete(listener);
  }, []);

  const subscribePresence = useCallback(
    (userId: string, listener: (online: boolean) => void) => {
      const map = presenceListenersRef.current;
      if (!map.has(userId)) map.set(userId, new Set());
      map.get(userId)!.add(listener);
      return () => map.get(userId)?.delete(listener);
    },
    [],
  );

  const notifyGlobal = useCallback(() => {
    setRefreshSignal((n) => n + 1);
    globalListenersRef.current.forEach((l) => l());
  }, []);

  const handleEventRef = useRef<(event: SupportStreamEvent) => void>(() => {});

  handleEventRef.current = (event: SupportStreamEvent) => {
    const ticketId = ticketIdFromEvent(event);

    if (event.type === "presence_changed" && event.data?.user_id != null) {
      const userId = String(event.data.user_id);
      const online = Boolean(event.data.online);
      presenceListenersRef.current.get(userId)?.forEach((l) => l(online));
    }

    if (ticketId) {
      listenersRef.current.get(normalizeTicketId(ticketId))?.forEach((l) => l(event));
    }

    if (event.type === "ping") return;

    notifyGlobal();
  };

  useEffect(() => {
    if (!isAuthenticated || isLoading || !user) return;

    const controller = new AbortController();
    let retryDelay = STREAM_RETRY_MS;

    async function connect() {
      while (!controller.signal.aborted) {
        try {
          for await (const event of adminSupportService.stream(
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

    void connect();
    return () => controller.abort();
  }, [isAuthenticated, isLoading, user, getIdToken]);

  const value = useMemo(
    () => ({
      alerts,
      unreadCount: alerts.length,
      dismissAlert,
      dismissAlertsForTicket,
      dismissAllAlerts,
      subscribeTicket,
      subscribeGlobal,
      subscribePresence,
      refreshSignal,
    }),
    [
      alerts,
      dismissAlert,
      dismissAlertsForTicket,
      dismissAllAlerts,
      subscribeTicket,
      subscribeGlobal,
      subscribePresence,
      refreshSignal,
    ],
  );

  return <SupportContext.Provider value={value}>{children}</SupportContext.Provider>;
}

export function useSupport() {
  const ctx = useContext(SupportContext);
  if (!ctx) throw new Error("useSupport must be used within SupportProvider");
  return ctx;
}
