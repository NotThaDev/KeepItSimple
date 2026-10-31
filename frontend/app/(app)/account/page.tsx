import type { Metadata } from "next";
import { PageWrapper } from "@/components/common/pageContainer/PageWrapper";
import { getCurrentUser } from "@/lib/dal";
import { getSessions } from "@/lib/models/Session";
import { AccountPageContent } from "./AccountPageContent";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const [user, sessions] = await Promise.all([getCurrentUser(), getSessions()]);

  return (
    <PageWrapper title="Account">
      <AccountPageContent user={user} sessionsResponse={sessions} />
    </PageWrapper>
  );
}
