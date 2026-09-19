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
import { LineChart as LineChartIcon } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { useActiveExpenseAnalytics } from "@/stores/analytics";
import { formatMoney } from "../utils";

function getMaxValue(values: number[]): number {
  return values.length > 0
    ? Math.max(1, Math.ceil(Math.max(...values) * 1.1))
    : 1;
}

function toLinearCumulative(
  values: Array<number | null>,
): Array<number | null> {
  let lastIndex = -1;
  let lastValue = 0;

  for (let index = values.length - 1; index >= 0; index -= 1) {
    const value = values[index];
    if (value != null) {
      lastIndex = index;
      lastValue = value;
      break;
    }
  }

  if (lastIndex < 0) {
    return values.map(() => null);
  }

  const endDay = lastIndex + 1;
  return values.map((_, index) =>
    index > lastIndex ? null : (lastValue * (index + 1)) / endDay,
  );
}

export function ExpenseSpendingPaceChart() {
  const { analytics, currency } = useActiveExpenseAnalytics();
  const isSpendingMoreThanLastMonth =
    analytics.totalMonthlyExpenses > analytics.previousMonthExpenses;

  const thisMonthColor = isSpendingMoreThanLastMonth ? "#ef4444" : "#22c55e";
  const lastMonthColor = "#94a3b8";

  const chartConfig: ChartConfig = {
    thisMonth: {
      label: "This month",
      theme: {
        light: isSpendingMoreThanLastMonth ? "#dc2626" : "#16a34a",
        dark: thisMonthColor,
      },
    },
    lastMonth: {
      label: "Last month",
      theme: {
        light: "#cbd5e1",
        dark: lastMonthColor,
      },
    },
  };

  const seriesSwatch: Record<string, string> = {
    thisMonth: thisMonthColor,
    lastMonth: lastMonthColor,
  };

  const thisMonthPace = toLinearCumulative(
    analytics.monthlySpendingPace.map((entry) => entry.thisMonth),
  );
  const lastMonthPace = toLinearCumulative(
    analytics.monthlySpendingPace.map((entry) => entry.lastMonth),
  );
  const chartData = analytics.monthlySpendingPace.map((entry, index) => ({
    day: entry.day,
    thisMonth: thisMonthPace[index],
    lastMonth: lastMonthPace[index],
  }));
  const hasValues = chartData.some(
    (entry) => (entry.thisMonth ?? 0) > 0 || (entry.lastMonth ?? 0) > 0,
  );
  const yAxisMax = getMaxValue(
    chartData.flatMap((entry) => [entry.thisMonth ?? 0, entry.lastMonth ?? 0]),
  );
  const lastDay = chartData.at(-1)?.day ?? 31;
  const xTicks = [
    ...Array.from(
      { length: Math.floor((lastDay - 1) / 5) },
      (_, index) => 1 + index * 5,
    ),
    lastDay,
  ];

  return (
    <DashboardCard
      title="Spending pace"
      icon={LineChartIcon}
      className="h-auto"
    >
      {hasValues ? (
        <ChartContainer config={chartConfig} className="h-[192px] w-full">
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 0, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              ticks={xTicks}
              interval={0}
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
                  hideLabel={true}
                  className="w-fit min-w-fit"
                  formatter={(value, name) => {
                    const key = String(name);
                    const label =
                      key === "thisMonth" ? "This month" : "Last month";

                    return (
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              seriesSwatch[key] ?? lastMonthColor,
                          }}
                        />
                        <span className="text-muted-foreground mr-1">
                          {label}
                        </span>
                        <span className="font-mono font-medium text-foreground tabular-nums">
                          {formatMoney(Number(value), currency)}
                        </span>
                      </div>
                    );
                  }}
                />
              }
            />
            <Line
              dataKey="lastMonth"
              type="linear"
              stroke="var(--color-lastMonth)"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
            <Line
              dataKey="thisMonth"
              type="linear"
              stroke="var(--color-thisMonth)"
              strokeWidth={2}
              dot={false}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </LineChart>
        </ChartContainer>
      ) : (
        <p className="flex h-[168px] items-center justify-center text-sm text-muted-foreground">
          No spending recorded to chart this month.
        </p>
      )}
    </DashboardCard>
  );
}
