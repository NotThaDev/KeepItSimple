"use client";

import { DashboardCard } from "@/app/dashboard/cards/DashboardCard";
import { Progress } from "@/components/ui/progress";
import { Wallet } from "lucide-react";
import { useExpenseAnalytics } from "@/stores/analytics";
import { formatMoney, formatPercent } from "../utils";

export function IncomeCoverage() {
  const { analytics, currency } = useExpenseAnalytics();
  const spentShare = analytics.spendingRate;
  const progressValue = Math.min(spentShare * 100, 100);
  const isOverIncome = spentShare > 1;

  return (
    <DashboardCard title="Income coverage" icon={Wallet} className="h-auto">
      <div className="mt-2 flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">
              Spent {formatMoney(analytics.totalMonthlyExpenses, currency)}
            </p>
            <p className="text-sm text-muted-foreground">
              Income {formatMoney(analytics.monthlyIncome, currency)}
            </p>
          </div>
          <Progress
            value={progressValue}
            className={`mt-1 h-2 ${isOverIncome ? "[&_[data-slot=progress-indicator]]:bg-red-500" : ""}`}
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {Math.ceil(progressValue)}% Spent
            </p>
            <p className="text-sm text-muted-foreground">
              {formatMoney(
                analytics.monthlyIncome - analytics.totalMonthlyExpenses,
                currency,
              )}{" "}
              Available
            </p>
          </div>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/40 p-3 ring-1 ring-foreground/10">
            <p className="text-xs text-muted-foreground">At current pace</p>
            <p className="mt-1 text-lg font-semibold">
              {formatPercent(analytics.projectedSpendingRate)}
            </p>
          </div>
          <div className="rounded-lg bg-muted/40 p-3 ring-1 ring-foreground/10">
            <p className="text-xs text-muted-foreground">Last month</p>
            <p className="mt-1 text-lg font-semibold">
              {formatPercent(analytics.previousMonthSpendingRate)}
            </p>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}
