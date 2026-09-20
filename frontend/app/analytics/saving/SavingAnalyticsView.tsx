"use client";

import { TransactionTrackerCard } from "@/components/common/transactionTracker/TransactionTrackerCard";
import { formatAmount } from "@/lib/helpers/currencyHelper";
import { useSavingAnalytics } from "@/stores/analytics";
import { Percent, PiggyBank, Wallet } from "lucide-react";
import { useMemo } from "react";
import { AnalyticsStatRow } from "../AnalyticsStatCard";
import { formatPercent } from "../utils";
import { SavingCashFlowChart } from "./SavingCashFlowChart";
import { SavingLeftoverChart } from "./SavingLeftoverChart";
import { SavingTopTable } from "./SavingTopTable";
import { LeftoverBreakDown } from "./LeftoverBreakDown";
import { SavingsRate } from "./SavingsRate";

const PUT_ASIDE_INFO =
  "If you transfer money into a savings account that already exists in the app, tag the outgoing amount as Transfer, not Savings. Tag the incoming amount as Savings.";

export function SavingAnalyticsView() {
  const { analytics, currency } = useSavingAnalytics();
  const savingsByCategory = analytics.savingsByCategory.filter(
    (entry) => entry.total !== 0,
  );

  const analyticsItems = useMemo(() => {
    const delta =
      analytics.totalMonthlySavings - analytics.previousMonthSavings;
    const hasDelta =
      analytics.previousMonthSavings !== analytics.totalMonthlySavings;
    const isUp = delta > 0;

    return [
      {
        title: "Leftover",
        icon: Wallet,
        value: formatAmount(analytics.leftOver, currency),
        description: "Monthly leftover after expenses",
      },
      {
        title: "Put aside",
        icon: PiggyBank,
        value: formatAmount(analytics.totalMonthlySavings, currency),
        info: PUT_ASIDE_INFO,
        delta: hasDelta
          ? {
              formatted: formatAmount(Math.abs(delta), currency),
              isUp,
            }
          : undefined,
        description: hasDelta ? undefined : "Same as last month",
      },
      {
        title: "Capture rate",
        icon: Percent,
        value: formatPercent(analytics.captureRate),
        description: "Share of leftover tagged as savings",
      },
      {
        title: "Saving Rate",
        icon: Percent,
        value: formatPercent(analytics.savingsRate),
        description: "Share of income saved this month",
      },
    ];
  }, [analytics, currency]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-px pb-4">
      <AnalyticsStatRow items={analyticsItems} />

      <div className="grid shrink-0 grid-cols-1 gap-4 xl:min-h-[320px] xl:grid-cols-2">
        <LeftoverBreakDown />
        <SavingCashFlowChart />
      </div>
      <SavingLeftoverChart />
      <div className="grid shrink-0 grid-cols-1 gap-4 xl:min-h-[20rem] xl:grid-cols-2">
        <SavingsRate />
        <TransactionTrackerCard
          title="Savings by category"
          listTitle="This month by category"
          centerLabel="Savings"
          emptyTitle="No savings yet"
          emptyDescription="Savings recorded this month will appear here by category."
          icon={PiggyBank}
          className="h-auto min-h-[20rem] flex-none xl:min-h-[20rem]"
          categories={savingsByCategory}
          currency={currency}
        />
      </div>

      <SavingTopTable />
    </div>
  );
}
