import { EmptyStateCard } from "@/components/common/emptyState/EmptyStateCard";
import { PageWrapper } from "@/components/common/pageContainer/PageWrapper";
import { getAnalytics } from "@/lib/models/Analytics";
import { getPockets } from "@/lib/models/Pocket";
import { WalletCards } from "lucide-react";
import { BudgetTrackerCard } from "./cards/BudgetTrackerCard";
import { SpendingChartCard } from "./cards/SpendingChartCard";
import { TotalBalanceCard } from "./cards/TotalBalanceCard";

export default async function DashboardPage() {
  const [pocketsResponse, analyticsResponse] = await Promise.all([
    getPockets(),
    getAnalytics(),
  ]);

  const pockets = pocketsResponse.data ?? [];
  const analytics = analyticsResponse.data;

  let content;
  if (pockets.length === 0) {
    content = (
      <EmptyStateCard
        title="No pockets yet"
        description="Create your first pocket to start tracking balances and transactions from the dashboard."
        actionText="Create Pocket"
        actionHref="/pockets"
        icon={WalletCards}
      />
    );
  } else if (analytics == undefined) {
    content = (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        Failed to load analytics data. Please try again later.
      </div>
    );
  } else {
    content = (
      <div className="flex h-full min-h-0 flex-col gap-[16px] overflow-y-auto">
        <div className="grid grid-cols-1 gap-[16px] xl:min-h-0 xl:flex-1 xl:grid-cols-2">
          <TotalBalanceCard analytics={analytics} />
          <BudgetTrackerCard analytics={analytics} />
        </div>

        <div className="grid grid-cols-1 gap-[16px] xl:min-h-0 xl:flex-1 xl:grid-cols-1">
          <SpendingChartCard analytics={analytics} />
        </div>
      </div>
    );
  }

  return (
    <PageWrapper title="Dashboard" maximizeContent>
      {content}
    </PageWrapper>
  );
}
