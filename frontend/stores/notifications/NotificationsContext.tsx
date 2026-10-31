"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import {
  getNotifications,
  getUnreadSummary,
  markNotificationRead,
} from "@/lib/models/Notification";
import type { InAppNotification } from "@/lib/models/Notification";
import { NewNotificationToast } from "@/components/notifications/NewNotificationToast";
import type { NotificationsContext, NotificationsTab } from "./types";

const POLL_INTERVAL_MS = 30_000;

const NotificationsReactContext = createContext<NotificationsContext | null>(
  null,
);

interface NotificationsProviderProps {
  children: ReactNode;
}

export function NotificationsProvider({
  children,
}: Readonly<NotificationsProviderProps>) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTabState] = useState<NotificationsTab>("unread");
  const [items, setItems] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  // undefined = first poll not done yet, so existing notifications do not toast on page load.
  const lastLatestId = useRef<number | null | undefined>(undefined);
  // Read inside the poll callback, which must keep the same identity.
  const drawerRef = useRef({ isOpen, tab });

  useEffect(() => {
    drawerRef.current = { isOpen, tab };
  }, [isOpen, tab]);

  // Only the latest request may write the list, so a slow earlier tab cannot overwrite the current one.
  const loadSeq = useRef(0);

  const loadItems = useCallback(async (nextTab: NotificationsTab) => {
    const seq = ++loadSeq.current;
    setLoading(true);
    const response = await getNotifications(nextTab === "read");
    if (seq !== loadSeq.current) return;
    if (response.error) {
      toast.error(`Failed to load notifications: ${response.error}`);
    } else {
      setItems(response.data ?? []);
    }
    setLoading(false);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
    setTabState("unread");
    void loadItems("unread");
  }, [loadItems]);

  const close = useCallback(() => setIsOpen(false), []);

  const setOpen = useCallback(
    (value: boolean) => (value ? open() : close()),
    [open, close],
  );

  const setTab = useCallback(
    (nextTab: NotificationsTab) => {
      setTabState(nextTab);
      void loadItems(nextTab);
    },
    [loadItems],
  );

  const announce = useCallback(
    async () => {
      const response = await getNotifications(false);
      const title = response.data?.[0]?.title;
      toast.custom(
        (id) => (
          <NewNotificationToast
            title={title}
            onView={() => {
              toast.dismiss(id);
              open();
            }}
            onDismiss={() => toast.dismiss(id)}
          />
        ),
        {
          id: "new-notification",
          // The mobile bottom nav covers the bottom edge, so phones get the app's usual top-center spot.
          position: window.matchMedia("(min-width: 768px)").matches ? "bottom-right" : "top-center",
          duration: 8000,
        },
      );
    },
    [open],
  );

  // Silent on error: a failing poll must not spam toasts.
  const refreshSummary = useCallback(async () => {
    const response = await getUnreadSummary();
    if (response.error || !response.data) return;

    const { count, latestId } = response.data;
    const previousLatestId = lastLatestId.current;
    setUnreadCount(count);

    if (
      previousLatestId !== undefined &&
      latestId !== null &&
      (previousLatestId === null || latestId > previousLatestId)
    ) {
      void announce();
    }

    lastLatestId.current = latestId;

    const drawer = drawerRef.current;
    if (drawer.isOpen && drawer.tab === "unread" && latestId !== previousLatestId) {
      void loadItems("unread");
    }
  }, [announce, loadItems]);

  useEffect(() => {
    // Deferred so the first poll runs outside the effect body (react-hooks/set-state-in-effect).
    const initial = window.setTimeout(() => void refreshSummary(), 0);

    const interval = window.setInterval(() => {
      if (!document.hidden) void refreshSummary();
    }, POLL_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (!document.hidden) void refreshSummary();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refreshSummary]);

  const markRead = useCallback(
    async (id: number) => {
      const previousItems = items;
      const previousCount = unreadCount;
      setItems(items.filter((item) => item.id !== id));
      setUnreadCount(Math.max(0, unreadCount - 1));

      const response = await markNotificationRead(id);
      if (response.error) {
        setItems(previousItems);
        setUnreadCount(previousCount);
        toast.error(`Failed to mark as read: ${response.error}`);
      }
    },
    [items, unreadCount],
  );

  const value = useMemo<NotificationsContext>(
    () => ({
      unreadCount,
      isOpen,
      tab,
      items,
      loading,
      open,
      close,
      setOpen,
      setTab,
      markRead,
    }),
    [
      unreadCount,
      isOpen,
      tab,
      items,
      loading,
      open,
      close,
      setOpen,
      setTab,
      markRead,
    ],
  );

  return (
    <NotificationsReactContext.Provider value={value}>
      {children}
    </NotificationsReactContext.Provider>
  );
}

export function useNotificationsContext() {
  const context = useContext(NotificationsReactContext);
  if (!context) {
    throw new Error(
      "useNotificationsContext must be used within NotificationsProvider",
    );
  }
  return context;
}
