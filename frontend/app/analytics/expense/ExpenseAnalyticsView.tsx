"use client";

import { DashboardCard } from "@/app/dashboard/cards/DashboardCard";
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CalendarClock,
  Flame,
  Percent,
} from "lucide-react";
import { useActiveExpenseAnalytics } from "@/stores/analytics";
import { formatMoney, formatPercent } from "../utils";
import { ExpenseCategoryList } from "./ExpenseCategoryList";
import { ExpenseDensity } from "./ExpenseDensity";
import { ExpenseMonthlyComparisonChart } from "./ExpenseMonthlyComparisonChart";
import { ExpensePocketList } from "./ExpensePocketList";
import { ExpenseSpendingPaceChart } from "./ExpenseSpendingPaceChart";
import { ExpenseTopTable } from "./ExpenseTopTable";
import { FixedExpensesCard } from "./FixedExpensesCard";
import { IncomeCoverage } from "./IncomeCoverage";

export function ExpenseAnalyticsView() {
  const { analytics, currency } = useActiveExpenseAnalytics();
  const delta =
    analytics.totalMonthlyExpenses - analytics.previousMonthExpenses;
  const hasDelta =
    analytics.previousMonthExpenses !== analytics.totalMonthlyExpenses;
  const isSpendingMore = delta > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-px pb-4">
      <div className="grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard title="This month" icon={Banknote}>
          <p className="text-3xl font-semibold">
            {formatMoney(analytics.totalMonthlyExpenses, currency)}
          </p>
          {hasDelta ? (
            <div
              className={`mt-1 flex items-center gap-1 ${
                isSpendingMore ? "text-red-500" : "text-green-500"
              }`}
            >
              {isSpendingMore ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              <p className="text-sm">
                {formatMoney(Math.abs(delta), currency)} vs last month
              </p>
            </div>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              Same as last month
            </p>
          )}
        </DashboardCard>

        <DashboardCard title="Daily burn" icon={Flame}>
          <p className="text-3xl font-semibold">
            {formatMoney(analytics.dailyBurn, currency)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Average spent per day this month
          </p>
        </DashboardCard>

        <DashboardCard title="Month projection" icon={CalendarClock}>
          <p className="text-3xl font-semibold">
            {formatMoney(analytics.monthProjection, currency)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            At the current daily pace
          </p>
        </DashboardCard>

        <DashboardCard title="Spending rate" icon={Percent}>
          <p className="text-3xl font-semibold">
            {formatPercent(analytics.spendingRate)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Share of this month&apos;s income spent
          </p>
        </DashboardCard>
      </div>

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
        <ExpensePocketList />
      </div>
      <ExpenseTopTable />
    </div>
  );
}
