import type { Metadata } from "next";
import { PageWrapper } from "@/components/common/pageContainer/PageWrapper";
import { getCurrentUser } from "@/lib/dal";
import { AccountPageContent } from "./AccountPageContent";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await getCurrentUser();

  return (
    <PageWrapper title="Account">
      <AccountPageContent user={user} />
    </PageWrapper>
  );
}
