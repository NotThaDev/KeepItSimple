"use client";

import { EmptyWidgetState } from "@/components/common/emptyState/EmptyWidgetState";
import { DashboardCard } from "@/app/(app)/dashboard/cards/DashboardCard";
import { CategoryBadge } from "@/components/common/category/CategoryBadge";
import { CommonTable } from "@/components/common/table/CommonTable";
import { formatAmount } from "@/lib/helpers/currencyHelper";
import { useSavingAnalytics } from "@/stores/analytics";
import { ListOrdered } from "lucide-react";

export function SavingTopTable() {
  const { analytics, currency } = useSavingAnalytics();
  const topSavings = analytics.topSavings.filter((entry) => entry.total !== 0);

  return (
    <DashboardCard
      title="Top savings this month"
      icon={ListOrdered}
      className="h-auto shrink-0"
    >
      {topSavings.length === 0 ? (
        <EmptyWidgetState
          title="No savings yet"
          description="Your largest savings this month will be listed here."
          className="min-h-[120px]"
        />
      ) : (
        <CommonTable
          tableClassName="table-fixed"
          data={topSavings}
          getRowKey={(entry, index) => `${entry.category}-${index}`}
          columns={[
            {
              id: "rank",
              header: "#",
              headerClassName: "w-10",
              cell: (_entry, index) => (
                <span className="text-muted-foreground">{index + 1}</span>
              ),
            },
            {
              id: "category",
              header: "Category",
              cell: (entry) => <CategoryBadge category={entry.category} />,
            },
            {
              id: "amount",
              header: "Amount",
              headerClassName: "w-28",
              cell: (entry) => (
                <span className="font-medium">
                  {formatAmount(entry.total, currency)}
                </span>
              ),
            },
          ]}
        />
      )}
    </DashboardCard>
  );
}
