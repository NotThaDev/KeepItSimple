"use client";

import { DashboardCard } from "@/app/dashboard/cards/DashboardCard";
import { Progress } from "@/components/ui/progress";
import { Wallet } from "lucide-react";
import { useActiveExpenseAnalytics } from "@/stores/analytics";
import { formatMoney } from "../utils";

export function ExpensePocketList() {
  const { analytics } = useActiveExpenseAnalytics();
  const sortedPockets = [...analytics.expensePerPocket].sort(
    (left, right) => Math.abs(right.total) - Math.abs(left.total),
  );
  const maxTotal = Math.max(
    ...sortedPockets.map((entry) => Math.abs(entry.total)),
    0,
  );

  return (
    <DashboardCard title="Expenses by pocket" icon={Wallet} className="h-auto">
      {sortedPockets.length === 0 ? (
        <p className="mt-2 flex items-center justify-center text-sm text-muted-foreground">
          No pockets to show for this expense view.
        </p>
      ) : (
        <div className="mt-2 flex min-w-0 flex-1 flex-col gap-4">
          {sortedPockets.map((entry) => {
            const percentage =
              maxTotal === 0 ? 0 : (Math.abs(entry.total) / maxTotal) * 100;

            return (
              <div key={entry.pocket.id} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{entry.pocket.name}</p>
                  <p className="rounded-md bg-secondary px-2 py-0.5 text-secondary-foreground">
                    {formatMoney(entry.total, entry.pocket.currency)}
                  </p>
                </div>
                <Progress value={percentage} />
              </div>
            );
          })}
        </div>
      )}
    </DashboardCard>
  );
}
