"use client";

import { Banknote, CalendarClock, Flame, Percent } from "lucide-react";
import { useExpenseAnalytics } from "@/stores/analytics";
import { formatMoney, formatPercent } from "../utils";
import { AnalyticsStatRow } from "../AnalyticsStatCard";
import { ExpenseCategoryList } from "./ExpenseCategoryList";
import { ExpenseDensity } from "./ExpenseDensity";
import { ExpenseMonthlyComparisonChart } from "./ExpenseMonthlyComparisonChart";
import { ExpenseSpendingPaceChart } from "./ExpenseSpendingPaceChart";
import { ExpenseTopTable } from "./ExpenseTopTable";
import { FixedExpensesCard } from "./FixedExpensesCard";
import { IncomeCoverage } from "./IncomeCoverage";
import { PocketList } from "../PocketList";
import { useMemo } from "react";

export function ExpenseAnalyticsView() {
  const { analytics, currency } = useExpenseAnalytics();

  const analyticsItems = useMemo(() => {
    const delta =
      analytics.totalMonthlyExpenses - analytics.previousMonthExpenses;
    const hasDelta =
      analytics.previousMonthExpenses !== analytics.totalMonthlyExpenses;
    const isSpendingMore = delta > 0;
    return [
      {
        title: "This month",
        icon: Banknote,
        value: formatMoney(analytics.totalMonthlyExpenses, currency),
        delta: hasDelta
          ? {
              formatted: formatMoney(Math.abs(delta), currency),
              isUp: isSpendingMore,
              upIsGood: false,
            }
          : undefined,
        description: hasDelta ? undefined : "Same as last month",
      },
      {
        title: "Daily burn",
        icon: Flame,
        value: formatMoney(analytics.dailyBurn, currency),
        description: "Average spent per day this month",
      },
      {
        title: "Month projection",
        icon: CalendarClock,
        value: formatMoney(analytics.monthProjection, currency),
        description: "At the current daily pace",
      },
      {
        title: "Spending rate",
        icon: Percent,
        value: formatPercent(analytics.spendingRate),
        description: "Share of this month's income spent",
      },
    ];
  }, [analytics, currency]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-px pb-4">
      <AnalyticsStatRow items={analyticsItems} />

      <div className="grid shrink-0 grid-cols-1 gap-4 xl:grid-cols-2">
        <ExpenseSpendingPaceChart />
        <IncomeCoverage />
      </div>

      <div className="grid shrink-0 grid-cols-1 gap-4 xl:min-h-[320px] xl:grid-cols-2">
        <ExpenseCategoryList />
        <FixedExpensesCard />
      </div>

      <ExpenseMonthlyComparisonChart />

      <div className="grid shrink-0 grid-cols-1 gap-4 xl:grid-cols-2">
        <ExpenseDensity />
        <PocketList
          title="Expenses by pocket"
          pockets={analytics.expensePerPocket}
          emptyMessage="No pockets to show for this expense view."
        />
      </div>
      <ExpenseTopTable />
    </div>
  );
}
