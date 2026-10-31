import type { InAppNotification } from "@/lib/models/Notification";

export type NotificationsTab = "unread" | "read";

export interface NotificationsContextState {
  unreadCount: number;
  isOpen: boolean;
  tab: NotificationsTab;
  items: InAppNotification[];
  loading: boolean;
}

export interface NotificationsContextAction {
  open: () => void;
  close: () => void;
  setOpen: (open: boolean) => void;
  setTab: (tab: NotificationsTab) => void;
  markRead: (id: number) => Promise<void>;
}

export type NotificationsContext = NotificationsContextState &
  NotificationsContextAction;
