"use client";

import { DashboardCard } from "@/app/dashboard/cards/DashboardCard";
import { Progress } from "@/components/ui/progress";
import { Wallet } from "lucide-react";
import { useActiveAnalytics } from "@/stores/analytics";
import { formatMoney } from "../utils";

export function IncomePocketList() {
  const { analytics } = useActiveAnalytics();
  const sortedPockets = [...analytics.monthlyIncomePerPocket].sort(
    (left, right) => Math.abs(right.total) - Math.abs(left.total),
  );
  const maxTotal = Math.max(
    ...sortedPockets.map((entry) => Math.abs(entry.total)),
    0,
  );

  return (
    <DashboardCard
      title="Income by pocket"
      icon={Wallet}
      className="h-auto min-h-[20rem]"
    >
      {sortedPockets.length === 0 ? (
        <p className="flex h-full min-h-[240px] items-center justify-center text-sm text-muted-foreground mt-2">
          No pockets to show for this income view.
        </p>
      ) : (
        <div className="flex min-h-[240px] flex-col gap-4 overflow-y-auto mt-2">
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
