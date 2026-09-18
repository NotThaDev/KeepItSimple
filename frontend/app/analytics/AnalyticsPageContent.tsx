"use client";

import { EmptyStateCard } from "@/components/common/emptyState/EmptyStateCard";
import { Selection } from "@/components/common/selector/Selection";
import { DashboardCard } from "@/app/dashboard/cards/DashboardCard";
import { FetchWrapperResponse } from "@/lib/fetchWrapper";
import {
  ANALYTICS_KIND_ITEMS,
  ANALYTICS_RANGE_ITEMS,
  AnalyticsKind,
  AnalyticsTimeRange,
  comparisonRangeLabel,
  PeriodInsight,
  toAnalyticsSearchParams,
} from "@/lib/models/Analytics";
import { formatCategoryLabel } from "@/lib/models/Transaction";
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CircleDollarSign,
  Percent,
  PiggyBank,
  ReceiptText,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";
import { InsightCategoryChart } from "./cards/InsightCategoryChart";
import { InsightPocketList } from "./cards/InsightPocketList";
import { InsightTrendChart } from "./cards/InsightTrendChart";
import { formatMoney, isFavorableChange, kindNoun } from "./utils";

interface AnalyticsPageContentProps {
  insightResponse: FetchWrapperResponse<PeriodInsight>;
  kind: AnalyticsKind;
  range: AnalyticsTimeRange;
}

const KIND_ICONS = {
  [AnalyticsKind.Income]: Banknote,
  [AnalyticsKind.Spending]: ReceiptText,
  [AnalyticsKind.Savings]: PiggyBank,
  [AnalyticsKind.Investments]: TrendingUp,
  [AnalyticsKind.Interest]: Percent,
} as const;

export function AnalyticsPageContent({
  insightResponse,
  kind,
  range,
}: Readonly<AnalyticsPageContentProps>) {
  const router = useRouter();
  const pathname = usePathname();

  if ("error" in insightResponse) {
    toast.error("Failed to load analytics. Please try again later.");
  }

  const applySelection = useCallback(
    (nextKind: AnalyticsKind, nextRange: AnalyticsTimeRange) => {
      const queryString = toAnalyticsSearchParams(nextKind, nextRange);
      router.replace(queryString ? `${pathname}?${queryString}` : pathname);
    },
    [pathname, router],
  );

  const insight = insightResponse.data;
  const KindIcon = KIND_ICONS[kind];
  const previousLabel = comparisonRangeLabel(range);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="flex w-full flex-wrap items-center justify-end gap-2">
        <Selection
          className="w-[180px]"
          items={ANALYTICS_KIND_ITEMS}
          value={kind}
          onChange={(value) => applySelection(value as AnalyticsKind, range)}
        />
        <Selection
          className="w-[200px]"
          items={ANALYTICS_RANGE_ITEMS}
          value={range}
          onChange={(value) =>
            applySelection(kind, value as AnalyticsTimeRange)
          }
        />
      </div>

      {insight == undefined ? (
        <EmptyStateCard
          title="Analytics unavailable"
          description="We could not load analytics for this selection. Create a pocket and add transactions, then try again."
          actionText="Go to pockets"
          actionHref="/pockets"
          icon={WalletCards}
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <DashboardCard
              title={`Total ${kindNoun(kind)}`}
              icon={KindIcon}
            >
              <p className="text-3xl font-semibold">
                {formatMoney(insight.currentTotal, insight.currency)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Selected period
              </p>
            </DashboardCard>

            <DashboardCard title="Compared with" icon={CircleDollarSign}>
              {insight.hasComparison && previousLabel ? (
                <>
                  <p className="text-3xl font-semibold">
                    {formatMoney(insight.previousTotal, insight.currency)}
                  </p>
                  <ChangeHint insight={insight} previousLabel={previousLabel} />
                </>
              ) : (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Comparison is not available for all-time analytics.
                </p>
              )}
            </DashboardCard>

            <DashboardCard title="Top category" icon={KindIcon}>
              {insight.topCategory ? (
                <>
                  <p className="text-3xl font-semibold">
                    {formatCategoryLabel(insight.topCategory)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatMoney(
                      insight.byCategory[0]?.total ?? 0,
                      insight.currency,
                    )}{" "}
                    in this period
                  </p>
                </>
              ) : (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  No {kindNoun(kind)} recorded in this period.
                </p>
              )}
            </DashboardCard>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-1">
            <InsightTrendChart insight={insight} />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:min-h-[320px] xl:grid-cols-2">
            <InsightCategoryChart insight={insight} />
            <InsightPocketList insight={insight} />
          </div>
        </div>
      )}
    </div>
  );
}

function ChangeHint({
  insight,
  previousLabel,
}: Readonly<{ insight: PeriodInsight; previousLabel: string }>) {
  if (insight.changeAmount === 0) {
    return (
      <p className="mt-1 text-sm text-muted-foreground">
        No change vs {previousLabel}
      </p>
    );
  }

  const favorable = isFavorableChange(insight.kind, insight.changeAmount);
  const color = favorable ? "text-green-500" : "text-red-500";
  const Icon = insight.changeAmount > 0 ? ArrowUpRight : ArrowDownRight;
  const percentLabel =
    insight.changePercent == null
      ? "new activity"
      : `${insight.changePercent > 0 ? "+" : ""}${insight.changePercent.toFixed(1)}%`;

  return (
    <div className={`mt-1 flex items-center gap-1 ${color}`}>
      <Icon className="h-4 w-4" />
      <p className="text-sm">
        {formatMoney(insight.changeAmount, insight.currency)} ({percentLabel}) vs{" "}
        {previousLabel}
      </p>
    </div>
  );
}
