import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/dal";
import { getSessions } from "@/lib/models/Session";
import { AccountPageContent } from "./AccountPageContent";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const [user, sessions] = await Promise.all([getCurrentUser(), getSessions()]);

  return <AccountPageContent user={user} sessionsResponse={sessions} />;
}
