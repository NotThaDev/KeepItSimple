"use client";

import { EmptyStateCard } from "@/components/common/emptyState/EmptyStateCard";
import { AnalyticsView, useAnalytics } from "@/stores/analytics";
import { ChartNoAxesCombined, WalletCards } from "lucide-react";
import { AnalyticsLoadingSkeleton } from "./AnalyticsSkeleton";
import { ExpenseAnalyticsView } from "./expense/ExpenseAnalyticsView";
import { IncomeAnalyticsView } from "./income/IncomeAnalyticsView";

export function AnalyticsPageContent() {
  const { view, analytics, isLoading, setView } = useAnalytics();

  if (view === AnalyticsView.Saving) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <EmptyStateCard
          title="Saving analytics coming soon"
          description="Saving analytics will load here when this view is enabled."
          actionText="Back to income"
          onAction={() => setView(AnalyticsView.Income)}
          icon={ChartNoAxesCombined}
        />
      </div>
    );
  }

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
      ) : (
        <ExpenseAnalyticsView />
      )}
    </div>
  );
}
