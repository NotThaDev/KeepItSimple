"use client";

import { EmptyStateCard } from "@/components/common/emptyState/EmptyStateCard";
import { AnalyticsView, useAnalytics } from "@/stores/analytics";
import { WalletCards } from "lucide-react";
import { AnalyticsLoadingSkeleton } from "./AnalyticsSkeleton";
import { ExpenseAnalyticsView } from "./expense/ExpenseAnalyticsView";
import { IncomeAnalyticsView } from "./income/IncomeAnalyticsView";
import { SavingAnalyticsView } from "./saving/SavingAnalyticsView";

export function AnalyticsPageContent() {
  const { view, analytics, isLoading } = useAnalytics();

  if (isLoading) {
    return <AnalyticsLoadingSkeleton />;
  }

  if (analytics == undefined) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <EmptyStateCard
          title="Analytics unavailable"
          description="We could not load analytics. Create a pocket and add transactions, then try again."
          actionText="Go to pockets"
          actionHref="/pockets"
          icon={WalletCards}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {view === AnalyticsView.Income ? (
        <IncomeAnalyticsView />
      ) : view === AnalyticsView.Expense ? (
        <ExpenseAnalyticsView />
      ) : (
        <SavingAnalyticsView />
      )}
    </div>
  );
}
