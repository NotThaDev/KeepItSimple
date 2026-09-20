"use client";

import {
  Banknote,
  CalendarRange,
  Percent,
  PieChart as PieChartIcon,
  TrendingUp,
} from "lucide-react";
import { useIncomeAnalytics } from "@/stores/analytics";
import { formatMoney, formatPercent } from "../utils";
import { TransactionTrackerCard } from "@/components/common/transactionTracker/TransactionTrackerCard";
import { AnalyticsStatRow } from "../AnalyticsStatCard";
import { PocketList } from "../PocketList";
import { IncomeCashFlowChart } from "./IncomeCashFlowChart";
import { IncomeTopTable } from "./IncomeTopTable";
import { IncomeTrendChart } from "./IncomeTrendChart";
import { ActivePassiveCard } from "./ActivePassiveCard";
import { useMemo } from "react";

export function IncomeAnalyticsView() {
  const { analytics, currency } = useIncomeAnalytics();

  const analyticsItems = useMemo(() => {
    const delta = analytics.totalMonthlyIncome - analytics.previousMonthIncome;
    const hasDelta =
      analytics.previousMonthIncome !== analytics.totalMonthlyIncome;
    const isUp = delta > 0;

    return [
      {
        title: "This month",
        icon: Banknote,
        value: formatMoney(analytics.totalMonthlyIncome, currency),
        delta: hasDelta
          ? {
              formatted: formatMoney(Math.abs(delta), currency),
              isUp,
            }
          : undefined,
        description: hasDelta ? undefined : "Same as last month",
      },
      {
        title: "Last month",
        icon: CalendarRange,
        value: formatMoney(analytics.previousMonthIncome, currency),
        description: "Previous calendar month",
      },
      {
        title: "6-month average",
        icon: TrendingUp,
        value: formatMoney(analytics.sixMonthAverageIncome, currency),
        description: "Average monthly income",
      },
      {
        title: "Savings rate",
        icon: Percent,
        value: formatPercent(analytics.savingsRate),
        description: "Share of this month kept",
      },
    ];
  }, [analytics, currency]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-px pb-4">
      <AnalyticsStatRow items={analyticsItems} />

      <div className="grid shrink-0 grid-cols-1 gap-4 xl:min-h-[320px] xl:grid-cols-2">
        <TransactionTrackerCard
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
        <PocketList
          title="Income by pocket"
          pockets={analytics.monthlyIncomePerPocket}
          emptyMessage="No pockets to show for this income view."
        />
        <ActivePassiveCard />
      </div>
      <IncomeTopTable />
    </div>
  );
}
