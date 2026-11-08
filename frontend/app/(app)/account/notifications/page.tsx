import type { Metadata } from "next";
import { getImportReminder } from "@/lib/models/Notification";
import { NotificationsPageContent } from "./NotificationsPageContent";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const importReminderResponse = await getImportReminder();

  return <NotificationsPageContent importReminderResponse={importReminderResponse} />;
}
