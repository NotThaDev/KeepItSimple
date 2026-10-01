"use client";

import { DashboardCard } from "@/app/dashboard/cards/DashboardCard";
import { CategoryBadge } from "@/components/common/CategoryBadge";
import { CommonTable } from "@/components/common/table/CommonTable";
import { format } from "date-fns";
import { ListOrdered } from "lucide-react";
import { useIncomeAnalytics } from "@/stores/analytics";
import { formatAmount } from "@/lib/helpers/currencyHelper";

export function IncomeTopTable() {
  const { analytics, currency } = useIncomeAnalytics();
  const pocketNameById = new Map(
    analytics.monthlyIncomePerPocket.map((entry) => [
      entry.pocket.id,
      entry.pocket.name,
    ]),
  );

  return (
    <DashboardCard
      title="Top income this month"
      icon={ListOrdered}
      className="h-auto shrink-0"
    >
      {analytics.topMonthlyIncome.length === 0 ? (
        <p className="flex min-h-[120px] items-center justify-center text-sm text-muted-foreground">
          No income transactions recorded this month.
        </p>
      ) : (
        <CommonTable
          tableClassName="table-fixed"
          data={analytics.topMonthlyIncome}
          getRowKey={(transaction, index) => String(transaction.id ?? index)}
          columns={[
            {
              id: "rank",
              header: "#",
              headerClassName: "w-10",
              cell: (_transaction, index) => (
                <span className="text-muted-foreground">{index + 1}</span>
              ),
            },
            {
              id: "amount",
              header: "Amount",
              headerClassName: "w-28",
              cell: (transaction) => (
                <span className="font-medium">
                  {formatAmount(transaction.amount, currency)}
                </span>
              ),
            },
            {
              id: "date",
              header: "Date",
              headerClassName: "w-28",
              cell: (transaction) => format(transaction.date, "d MMM yyyy"),
            },
            {
              id: "category",
              header: "Category",
              headerClassName: "w-32",
              cell: (transaction) => (
                <CategoryBadge category={transaction.category} />
              ),
            },
            {
              id: "pocket",
              header: "Pocket",
              headerClassName: "w-28",
              cell: (transaction) =>
                pocketNameById.get(transaction.pocketId) ?? "-",
            },
          ]}
        />
      )}
    </DashboardCard>
  );
}
