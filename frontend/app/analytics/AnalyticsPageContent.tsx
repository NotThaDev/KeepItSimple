"use client";

import { EmptyStateCard } from "@/components/common/emptyState/EmptyStateCard";
import { AnalyticsView, useAnalytics } from "@/stores/analytics";
import { ChartNoAxesCombined, WalletCards } from "lucide-react";
import { IncomeAnalyticsView } from "./income/IncomeAnalyticsView";

export function AnalyticsPageContent() {
  const { view, analytics, isLoading, setView } = useAnalytics();

  let content;
  if (view === AnalyticsView.Income && analytics == undefined) {
    content = (
      <EmptyStateCard
        title="Analytics unavailable"
        description="We could not load income analytics. Create a pocket and add transactions, then try again."
        actionText="Go to pockets"
        actionHref="/pockets"
        icon={WalletCards}
      />
    );
  } else if (view === AnalyticsView.Income && analytics) {
    content = <IncomeAnalyticsView />;
  } else if (isLoading) {
    content = (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        Loading expense analytics...
      </div>
    );
  } else {
    const label = view === AnalyticsView.Saving ? "Saving" : "Expense";
    content = (
      <EmptyStateCard
        title={`${label} analytics coming soon`}
        description={`${label} analytics will load here when this view is enabled.`}
        actionText="Back to income"
        onAction={() => setView(AnalyticsView.Income)}
        icon={ChartNoAxesCombined}
      />
    );
  }

  return <div className="flex min-h-0 flex-1 flex-col gap-4">{content}</div>;
}
