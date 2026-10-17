"use client";

import { formatAmount } from "@/lib/helpers/currencyHelper";
import { useExpenseAnalytics } from "@/stores/analytics";
import { Banknote, CalendarClock, Flame, Percent } from "lucide-react";
import { useMemo } from "react";
import { AnalyticsStatRow } from "../AnalyticsStatCard";
import { PocketList } from "../PocketList";
import { formatPercent } from "../utils";
import { ExpenseCategoryList } from "./ExpenseCategoryList";
import { ExpenseDensity } from "./ExpenseDensity";
import { ExpenseMonthlyComparisonChart } from "./ExpenseMonthlyComparisonChart";
import { ExpenseSpendingPaceChart } from "./ExpenseSpendingPaceChart";
import { ExpenseTopTable } from "./ExpenseTopTable";
import { FixedExpensesCard } from "./FixedExpensesCard";
import { IncomeCoverage } from "./IncomeCoverage";

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
        value: formatAmount(analytics.totalMonthlyExpenses, currency),
        delta: hasDelta
          ? {
              formatted: formatAmount(Math.abs(delta), currency),
              isUp: isSpendingMore,
              upIsGood: false,
            }
          : undefined,
        description: hasDelta ? undefined : "Same as last month",
      },
      {
        title: "Daily burn",
        icon: Flame,
        value: formatAmount(analytics.dailyBurn, currency),
        description: "Average spent per day this month",
      },
      {
        title: "Month projection",
        icon: CalendarClock,
        value: formatAmount(analytics.monthProjection, currency),
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
