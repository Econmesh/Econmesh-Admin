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
import { toast } from "sonner";

import { usePathname } from "next/navigation";

import { useAuth } from "@/hooks/use-auth";
import { normalizeTicketId } from "@/modules/support/support-realtime";
import { notificationsService } from "@/services/admin/support.service";
import type { UserNotification } from "@/types/api";

const STREAM_RETRY_MS = 3_000;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function normalizeNotification(raw: UserNotification): UserNotification {
  return {
    ...raw,
    id: String(raw.id),
    campaign_id: raw.campaign_id ? String(raw.campaign_id) : null,
    kind: raw.kind ?? "general",
    metadata: raw.metadata ?? {},
  };
}

function isViewingSupportTicket(pathname: string | null, ticketId: string) {
  return pathname?.toLowerCase() === `/dashboard/suporte/${normalizeTicketId(ticketId)}`;
}

type NotificationContextValue = {
  unreadNotifications: UserNotification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user, getIdToken } = useAuth();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const [unreadNotifications, setUnreadNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    const token = await getIdToken();
    if (!token) return;
    setLoading(true);
    try {
      const [list, count] = await Promise.all([
        notificationsService.list({ page: 1, page_size: 50, unread_only: true }),
        notificationsService.unreadCount(),
      ]);
      setUnreadNotifications(list.items.map(normalizeNotification));
      setUnreadCount(count.count);
    } catch {
      // Do not crash the dashboard; auth codes already trigger session redirect.
    } finally {
      setLoading(false);
    }
  }, [getIdToken, isAuthenticated]);

  const markRead = useCallback(async (id: string) => {
    await notificationsService.markRead(id);
    setUnreadNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationsService.markAllRead();
    setUnreadNotifications([]);
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || isLoading || !user) return;
    void refresh();
  }, [isAuthenticated, isLoading, user, refresh]);

  useEffect(() => {
    if (!isAuthenticated || isLoading || !user) {
      abortRef.current?.abort();
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    let retryDelay = STREAM_RETRY_MS;

    async function connect() {
      while (!controller.signal.aborted) {
        try {
          for await (const event of notificationsService.stream(
            () => getIdToken(),
            controller.signal,
          )) {
            retryDelay = STREAM_RETRY_MS;
            if (event.type === "notification" && event.data) {
              const n = normalizeNotification(event.data);
              const ticketId = n.metadata?.ticket_id;
              if (
                n.kind === "support" &&
                ticketId &&
                isViewingSupportTicket(pathnameRef.current, ticketId)
              ) {
                continue;
              }
              setUnreadNotifications((prev) => {
                if (prev.some((x) => x.id === n.id)) return prev;
                setUnreadCount((c) => c + 1);
                const isPublicSiteSupport =
                  n.kind === "support" &&
                  (n.metadata?.source === "external" ||
                    n.metadata?.source === "contact_request");
                if (isPublicSiteSupport) {
                  toast.info(n.title, {
                    description: n.body,
                    duration: 8000,
                  });
                } else {
                  toast.info(n.title, { description: n.body });
                }
                return [n, ...prev];
              });
            }
          }
        } catch (streamError) {

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
      unreadNotifications,
      unreadCount,
      loading,
      refresh,
      markRead,
      markAllRead,
    }),
    [unreadNotifications, unreadCount, loading, refresh, markRead, markAllRead],
  );

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
