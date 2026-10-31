"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import type { FetchWrapperResponse } from "@/lib/fetchWrapper";
import type { ImportReminderSetting } from "@/lib/models/Notification";
import { ImportReminderCard } from "./importReminder/ImportReminderCard";

interface NotificationsPageContentProps {
  importReminderResponse: FetchWrapperResponse<ImportReminderSetting>;
}

export function NotificationsPageContent({
  importReminderResponse,
}: Readonly<NotificationsPageContentProps>) {
  const loadError = importReminderResponse.error;

  useEffect(() => {
    if (loadError) {
      toast.error(`Failed to load notification settings: ${loadError}`);
    }
  }, [loadError]);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Choose which reminders KeepItSimple sends you and how.
      </p>
      <ImportReminderCard initial={importReminderResponse.data ?? null} />
    </div>
  );
}
