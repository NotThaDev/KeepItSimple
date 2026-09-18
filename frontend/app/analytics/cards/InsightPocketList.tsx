"use client";

import { DashboardCard } from "@/app/dashboard/cards/DashboardCard";
import { PeriodInsight } from "@/lib/models/Analytics";
import { Wallet } from "lucide-react";
import { formatMoney, kindNoun } from "../utils";

interface InsightPocketListProps {
  insight: PeriodInsight;
}

export function InsightPocketList({
  insight,
}: Readonly<InsightPocketListProps>) {
  const sortedPockets = [...insight.byPocket].sort(
    (left, right) => Math.abs(right.total) - Math.abs(left.total),
  );
  const maxTotal = Math.max(...sortedPockets.map((entry) => entry.total), 0);

  return (
    <DashboardCard title="By pocket" icon={Wallet}>
      {sortedPockets.length === 0 ? (
        <p className="flex h-full min-h-[240px] items-center justify-center text-sm text-muted-foreground">
          No pockets to show for this {kindNoun(insight.kind)} view.
        </p>
      ) : (
        <div className="flex min-h-[240px] flex-col gap-3">
          {sortedPockets.map((entry) => {
            const percentage =
              maxTotal === 0 ? 0 : (entry.total / maxTotal) * 100;

            return (
              <div key={entry.pocket.id} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{entry.pocket.name}</p>
                  <p className="rounded-md bg-secondary px-2 py-0.5 text-secondary-foreground">
                    {formatMoney(entry.total, entry.pocket.currency)}
                  </p>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardCard>
  );
}
