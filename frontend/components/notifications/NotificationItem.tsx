import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { InAppNotification } from "@/lib/models/Notification";
import { formatRelativeTime } from "./utils";

interface NotificationItemProps {
  notification: InAppNotification;
  onMarkRead?: (id: number) => void;
}

export function NotificationItem({
  notification,
  onMarkRead,
}: Readonly<NotificationItemProps>) {
  const isUnread = notification.readAt === null;

  return (
    <li className="group relative flex gap-3 px-4 py-3 transition-colors hover:bg-muted/50">
      <span
        aria-hidden="true"
        className={`mt-1.5 size-2 shrink-0 rounded-full ${isUnread ? "bg-primary" : "bg-transparent"}`}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p
          className={
            isUnread
              ? "text-sm font-semibold text-foreground"
              : "text-sm font-medium text-muted-foreground"
          }
        >
          {notification.title}
        </p>
        <p
          className={`line-clamp-3 text-sm ${isUnread ? "text-muted-foreground" : "text-muted-foreground/80"}`}
        >
          {notification.body}
        </p>
        <div className="flex items-center justify-between gap-2 pt-1">
          <time
            dateTime={notification.createdAt.toISOString()}
            title={notification.createdAt.toLocaleString()}
            className="text-xs text-muted-foreground tabular-nums"
          >
            {formatRelativeTime(notification.createdAt)}
          </time>
          {isUnread && onMarkRead && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              aria-label={`Mark "${notification.title}" as read`}
              onClick={() => onMarkRead(notification.id)}
            >
              <Check />
              Mark as read
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}
