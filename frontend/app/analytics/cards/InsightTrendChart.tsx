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
import {
  AnalyticsGranularity,
  PeriodInsight,
} from "@/lib/models/Analytics";
import { AreaChart as AreaChartIcon } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { formatMoney, isFavorableChange } from "../utils";

interface InsightTrendChartProps {
  insight: PeriodInsight;
}

function toSeriesValue(
  value: number,
  granularity: AnalyticsGranularity,
): number | null {
  if (granularity === AnalyticsGranularity.Day && value === 0) {
    return null;
  }
  return value;
}

function getMaxValue(values: number[]): number {
  return values.length > 0
    ? Math.max(1, Math.ceil(Math.max(...values) * 1.1))
    : 1;
}

export function InsightTrendChart({
  insight,
}: Readonly<InsightTrendChartProps>) {
  const isUp = insight.currentTotal >= insight.previousTotal;
  const currentIsPositive = isFavorableChange(insight.kind, isUp ? 1 : -1);

  const chartConfig: ChartConfig = {
    current: {
      label: "Selected period",
      theme: {
        light: currentIsPositive ? "#16a34a" : "#dc2626",
        dark: currentIsPositive ? "#22c55e" : "#ef4444",
      },
    },
    previous: {
      label: "Previous period",
      theme: {
        light: "#cbd5e1",
        dark: "#94a3b8",
      },
    },
  };

  const chartData = insight.series.map((entry) => ({
    label: entry.label,
    current: toSeriesValue(entry.total, insight.granularity),
    previous: insight.hasComparison
      ? toSeriesValue(entry.previousTotal, insight.granularity)
      : undefined,
  }));

  const chartValues = chartData.flatMap((entry) => [
    entry.current ?? 0,
    entry.previous ?? 0,
  ]);
  const yAxisMax = getMaxValue(chartValues);
  const hasValues = chartValues.some((value) => value > 0);

  return (
    <DashboardCard title="Trend" icon={AreaChartIcon}>
      {hasValues ? (
        <ChartContainer config={chartConfig} className="h-[270px] w-full">
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 0, right: 0 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval="preserveStartEnd"
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
                  formatter={(value) => [
                    formatMoney(Number(value), insight.currency),
                    undefined,
                  ]}
                />
              }
            />
            <defs>
              <linearGradient id="fillCurrentPeriod" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-current)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-current)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient
                id="fillPreviousPeriod"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="var(--color-previous)"
                  stopOpacity={0.35}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-previous)"
                  stopOpacity={0.06}
                />
              </linearGradient>
            </defs>
            {insight.hasComparison && (
              <Area
                dataKey="previous"
                name="previous"
                type="monotone"
                fill="url(#fillPreviousPeriod)"
                fillOpacity={0.18}
                stroke="var(--color-previous)"
                strokeWidth={2}
                connectNulls
              />
            )}
            <Area
              dataKey="current"
              name="current"
              type="monotone"
              fill="url(#fillCurrentPeriod)"
              fillOpacity={0.4}
              stroke="var(--color-current)"
              strokeWidth={2}
              connectNulls
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      ) : (
        <p className="flex h-[270px] items-center justify-center text-sm text-muted-foreground">
          No activity to chart for this period.
        </p>
      )}
    </DashboardCard>
  );
}
