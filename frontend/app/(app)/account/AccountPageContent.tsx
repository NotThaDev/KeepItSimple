import { EmptyStateCard } from "@/components/common/emptyState/EmptyStateCard";
import type { User } from "@/lib/models/Auth";
import { ProfileCard } from "./ProfileCard";

interface AccountPageContentProps {
  user: User | null;
}

export function AccountPageContent({ user }: Readonly<AccountPageContentProps>) {
  if (!user) {
    return (
      <EmptyStateCard
        title="Account unavailable"
        description="Could not load your account. Try again later."
      />
    );
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <ProfileCard user={user} />
    </div>
  );
}
