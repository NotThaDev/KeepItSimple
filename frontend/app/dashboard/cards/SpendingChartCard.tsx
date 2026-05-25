"use client";

import { DashboardCard } from "./DashboardCard";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Analytics } from "@/lib/models/Analytics";
import { AreaChart as AreaChartIcon } from "lucide-react";

interface SpendingChartCardProps {
  analytics: Analytics;
}

export function SpendingChartCard({
  analytics,
}: Readonly<SpendingChartCardProps>) {
  const currentMonthSpent = Math.abs(analytics.monthlyTotalExpenses);
  const previousMonthSpent = Math.abs(analytics.previousMonthTotalExpenses);
  const isSpendingMoreThanLastMonth = currentMonthSpent > previousMonthSpent;

  const chartConfig: ChartConfig = {
    thisMonth: {
      label: "This month",
      theme: {
        light: isSpendingMoreThanLastMonth ? "#dc2626" : "#16a34a",
        dark: isSpendingMoreThanLastMonth ? "#ef4444" : "#22c55e",
      },
    },
    lastMonth: {
      label: "Last month",
      theme: {
        light: "#cbd5e1",
        dark: "#94a3b8",
      },
    },
  };

  const toSeriesValue = (value: number) =>
    value === 0 ? null : Math.abs(value);

  const chartData = analytics.monthlyExpensesDailyComparison.map((entry) => ({
    day: entry.day,
    thisMonth: toSeriesValue(entry.thisMonth),
    lastMonth: toSeriesValue(entry.lastMonth),
  }));

  return (
    <DashboardCard title="Expenses trend" icon={AreaChartIcon}>
      <ChartContainer config={chartConfig} className="h-[220px] w-full">
        <AreaChart
          accessibilityLayer
          data={chartData}
          margin={{ left: 12, right: 12 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => `${value}`}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                formatter={(value) => [
                  `${Number(value).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`,
                  undefined,
                ]}
              />
            }
          />
          <defs>
            <linearGradient id="fillThisMonth" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-thisMonth)"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="var(--color-thisMonth)"
                stopOpacity={0.1}
              />
            </linearGradient>
            <linearGradient id="fillLastMonth" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-lastMonth)"
                stopOpacity={0.35}
              />
              <stop
                offset="95%"
                stopColor="var(--color-lastMonth)"
                stopOpacity={0.06}
              />
            </linearGradient>
          </defs>
          <Area
            dataKey="lastMonth"
            name="lastMonth"
            type="monotone"
            fill="url(#fillLastMonth)"
            fillOpacity={0.18}
            stroke="var(--color-lastMonth)"
            strokeWidth={2}
            connectNulls
          />
          <Area
            dataKey="thisMonth"
            name="thisMonth"
            type="monotone"
            fill="url(#fillThisMonth)"
            fillOpacity={0.4}
            stroke="var(--color-thisMonth)"
            strokeWidth={2}
            connectNulls
          />
          <ChartLegend content={<ChartLegendContent />} />
        </AreaChart>
      </ChartContainer>
    </DashboardCard>
  );
}
