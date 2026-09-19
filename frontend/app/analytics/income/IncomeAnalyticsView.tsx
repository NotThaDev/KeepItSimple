"use client";

import { DashboardCard } from "@/app/dashboard/cards/DashboardCard";
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CalendarRange,
  Percent,
  PieChart as PieChartIcon,
  TrendingUp,
} from "lucide-react";
import { useActiveAnalytics } from "@/stores/analytics";
import { formatMoney, formatPercent } from "../utils";
import { BudgetTrackerCard } from "@/app/dashboard/cards/BudgetTrackerCard";
import { IncomeCashFlowChart } from "./IncomeCashFlowChart";
import { IncomePocketList } from "./IncomePocketList";
import { IncomeTopTable } from "./IncomeTopTable";
import { IncomeTrendChart } from "./IncomeTrendChart";
import { ActivePassiveCard } from "./ActivePassiveCard";

export function IncomeAnalyticsView() {
  const { analytics, currency } = useActiveAnalytics();
  const delta = analytics.totalMonthlyIncome - analytics.previousMonthIncome;
  const hasDelta =
    analytics.previousMonthIncome !== analytics.totalMonthlyIncome;
  const isUp = delta > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-px pb-4">
      <div className="grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard title="This month" icon={Banknote}>
          <p className="text-3xl font-semibold">
            {formatMoney(analytics.totalMonthlyIncome, currency)}
          </p>
          {hasDelta ? (
            <div
              className={`mt-1 flex items-center gap-1 ${
                isUp ? "text-green-500" : "text-red-500"
              }`}
            >
              {isUp ? (
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

        <DashboardCard title="Last month" icon={CalendarRange}>
          <p className="text-3xl font-semibold">
            {formatMoney(analytics.previousMonthIncome, currency)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Previous calendar month
          </p>
        </DashboardCard>

        <DashboardCard title="6-month average" icon={TrendingUp}>
          <p className="text-3xl font-semibold">
            {formatMoney(analytics.sixMonthAverageIncome, currency)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Average monthly income
          </p>
        </DashboardCard>

        <DashboardCard title="Savings rate" icon={Percent}>
          <p className="text-3xl font-semibold">
            {formatPercent(analytics.savingsRate)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Share of this month kept
          </p>
        </DashboardCard>
      </div>

      <div className="grid shrink-0 grid-cols-1 gap-4 xl:min-h-[320px] xl:grid-cols-2">
        <BudgetTrackerCard
          title="Income by category"
          listTitle="This month by category"
          centerLabel="Income"
          emptyTitle="No income yet"
          emptyDescription="Income recorded this month will appear here by category."
          icon={PieChartIcon}
          className="h-auto min-h-[20rem] flex-none xl:min-h-[20rem]"
          categories={analytics.monthlyIncomeByCategory}
          currency={currency}
        />
        <IncomeCashFlowChart />
      </div>

      <IncomeTrendChart />

      <div className="grid shrink-0 grid-cols-1 gap-4 xl:grid-cols-2">
        <IncomePocketList />
        <ActivePassiveCard />
      </div>
      <IncomeTopTable />
    </div>
  );
}
