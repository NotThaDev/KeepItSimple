"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NewNotificationToastProps {
  title?: string;
  onView: () => void;
  onDismiss: () => void;
}

export function NewNotificationToast({
  title,
  onView,
  onDismiss,
}: Readonly<NewNotificationToastProps>) {
  return (
    <div className="relative flex w-[356px] max-w-[calc(100vw-2rem)] items-start gap-3 overflow-hidden rounded-lg border bg-popover p-4 pl-5 text-popover-foreground shadow-lg">
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-destructive" />
      <span className="relative mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-destructive/20 motion-safe:animate-ping"
        />
        <Bell className="relative size-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-sm font-semibold">
          New notification
        </p>
        {title && <p className="line-clamp-2 text-sm text-muted-foreground">{title}</p>}
        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={onView}>
            View
          </Button>
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}
