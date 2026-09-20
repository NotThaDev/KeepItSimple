"use client";

import { DashboardCard } from "@/app/dashboard/cards/DashboardCard";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart3 } from "lucide-react";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useExpenseAnalytics } from "@/stores/analytics";
import { MONTH_LABELS } from "../utils";
import { formatAmount } from "@/lib/helpers/currencyHelper";

function getMaxValue(values: number[]): number {
  return values.length > 0
    ? Math.max(1, Math.ceil(Math.max(...values) * 1.1))
    : 1;
}

const chartConfig: ChartConfig = {
  thisYear: {
    label: "This year",
    theme: {
      light: "#dc2626",
      dark: "#ef4444",
    },
  },
  lastYear: {
    label: "Last year",
    theme: {
      light: "#94a3b8",
      dark: "#64748b",
    },
  },
};

const SERIES_SWATCH: Record<string, string> = {
  thisYear: "#ef4444",
  lastYear: "#64748b",
};

export function ExpenseMonthlyComparisonChart() {
  const { analytics, currency } = useExpenseAnalytics();
  const chartData = useMemo(() => {
    return analytics.monthlySpendComparison.map((entry) => ({
      month: MONTH_LABELS[entry.month - 1] ?? String(entry.month),
      thisYear: entry.thisYear,
      lastYear: entry.lastYear,
    }));
  }, [analytics.monthlySpendComparison]);

  const hasValues = chartData.some(
    (entry) => (entry.thisYear ?? 0) > 0 || entry.lastYear > 0,
  );
  const yAxisMax = getMaxValue(
    chartData.flatMap((entry) => [entry.thisYear ?? 0, entry.lastYear]),
  );

  return (
    <DashboardCard
      title="Monthly spend"
      icon={BarChart3}
      className="h-auto shrink-0"
    >
      {hasValues ? (
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 0, right: 0 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              domain={[0, yAxisMax]}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  className="w-fit min-w-fit"
                  formatter={(value, name) => {
                    const key = String(name);
                    const label =
                      key === "thisYear" ? "This year" : "Last year";

                    return (
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor: SERIES_SWATCH[key] ?? "#94a3b8",
                          }}
                        />
                        <span className="text-muted-foreground mr-1">
                          {label}
                        </span>
                        <span className="font-mono font-medium text-foreground tabular-nums">
                          {formatAmount(Number(value), currency)}
                        </span>
                      </div>
                    );
                  }}
                />
              }
            />
            <Bar
              dataKey="lastYear"
              fill="var(--color-lastYear)"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              dataKey="thisYear"
              fill="var(--color-thisYear)"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </BarChart>
        </ChartContainer>
      ) : (
        <p className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
          No yearly spending recorded to compare by month.
        </p>
      )}
    </DashboardCard>
  );
}
