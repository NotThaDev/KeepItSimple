import type { ReactNode } from "react";
import { PageWrapper } from "@/components/common/pageContainer/PageWrapper";
import { AccountTabs } from "./AccountTabs";

interface AccountLayoutProps {
  children: ReactNode;
}

export default function AccountLayout({ children }: Readonly<AccountLayoutProps>) {
  return (
    <PageWrapper title="Account">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <AccountTabs />
        {children}
      </div>
    </PageWrapper>
  );
}
