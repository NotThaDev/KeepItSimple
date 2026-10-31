"use client";

import Link from "next/link";
import { BellOff, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useNotificationsContext } from "@/stores/notifications";
import type { NotificationsTab } from "@/stores/notifications";
import { NotificationItem } from "./NotificationItem";

export function NotificationsDrawer() {
  const {
    isOpen,
    setOpen,
    close,
    tab,
    setTab,
    unreadCount,
    items,
    loading,
    markRead,
  } = useNotificationsContext();

  const onTabChange = (value: string) => {
    if (value) setTab(value as NotificationsTab);
  };

  const emptyCopy =
    tab === "unread"
      ? {
          title: "You're all caught up",
          body: "New reminders show up here.",
        }
      : {
          title: "Nothing read yet",
          body: "Notifications you mark as read stay here for 30 days.",
        };

  return (
    <Drawer direction="right" open={isOpen} onOpenChange={setOpen}>
      <DrawerContent>
        <DrawerHeader className="flex-row items-center justify-between gap-2 border-b px-4 pt-4 pb-3">
          <DrawerTitle className="text-base font-semibold">Notifications</DrawerTitle>
          <DrawerDescription className="sr-only">
            Your recent notifications
          </DrawerDescription>
          <Button asChild variant="ghost" size="sm">
            <Link href="/account/notifications" onClick={close}>
              <Settings2 />
              Settings
            </Link>
          </Button>
        </DrawerHeader>

        <div className="px-4 py-3">
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            className="w-full"
            value={tab}
            onValueChange={onTabChange}
          >
            <ToggleGroupItem value="unread" className="flex-1">
              To read
              {unreadCount > 0 && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {` · ${unreadCount}`}
                </span>
              )}
            </ToggleGroupItem>
            <ToggleGroupItem value="read" className="flex-1">
              Read
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto">
          {loading && (
            <>
              <Skeleton className="mx-4 my-3 h-16" />
              <Skeleton className="mx-4 my-3 h-16" />
              <Skeleton className="mx-4 my-3 h-16" />
            </>
          )}

          {!loading && items.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-12 text-center">
              <BellOff className="size-8 text-muted-foreground/60" />
              <p className="font-medium">{emptyCopy.title}</p>
              <p className="text-sm text-muted-foreground">{emptyCopy.body}</p>
            </div>
          )}

          {!loading && items.length > 0 && (
            <ul className="divide-y">
              {items.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={tab === "unread" ? markRead : undefined}
                />
              ))}
            </ul>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
