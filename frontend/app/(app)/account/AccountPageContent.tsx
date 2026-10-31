"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { EmptyStateCard } from "@/components/common/emptyState/EmptyStateCard";
import type { FetchWrapperResponse } from "@/lib/fetchWrapper";
import type { User } from "@/lib/models/Auth";
import type { Session } from "@/lib/models/Session";
import { ProfileCard } from "./profile/ProfileCard";
import { SessionsCard } from "./sessions/SessionsCard";

interface AccountPageContentProps {
  user: User | null;
  sessionsResponse: FetchWrapperResponse<Session[]>;
}

export function AccountPageContent({
  user,
  sessionsResponse,
}: Readonly<AccountPageContentProps>) {
  useEffect(() => {
    if (sessionsResponse.error) {
      toast.error(`Failed to load sessions: ${sessionsResponse.error}`);
    }
  }, [sessionsResponse.error]);

  if (!user) {
    return (
      <EmptyStateCard
        title="Account unavailable"
        description="Could not load your account. Try again later."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ProfileCard user={user} />
      <SessionsCard sessions={sessionsResponse.data ?? []} />
    </div>
  );
}
