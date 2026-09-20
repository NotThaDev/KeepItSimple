"use client";

import { DashboardCard } from "@/app/dashboard/cards/DashboardCard";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatAmount } from "@/lib/helpers/currencyHelper";
import { useSavingAnalytics } from "@/stores/analytics";
import { ArrowLeftRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

const chartConfig: ChartConfig = {
  leftover: {
    label: "Leftover",
    theme: {
      light: "#2563eb",
      dark: "#60a5fa",
    },
  },
  putAside: {
    label: "Saved",
    theme: {
      light: "#0f766e",
      dark: "#14b8a6",
    },
  },
};

export function SavingCashFlowChart() {
  const { analytics, currency } = useSavingAnalytics();
  const chartData = [
    {
      key: "leftover",
      name: "Leftover",
      value: analytics.leftOver,
      fill: "var(--color-leftover)",
    },
    {
      key: "saved",
      name: "Saved",
      value: analytics.totalMonthlySavings,
      fill: "var(--color-putAside)",
    },
  ];

  const hasValues = chartData.some((entry) => entry.value !== 0);
  const values = chartData.map((entry) => entry.value);
  const yMax = Math.max(1, Math.ceil(Math.max(...values, 0) * 1.1));
  const yMin = Math.min(0, Math.floor(Math.min(...values, 0) * 1.1));

  return (
    <DashboardCard
      title="Leftover vs Saved"
      icon={ArrowLeftRight}
      className="h-auto min-h-[20rem]"
    >
      {hasValues ? (
        <ChartContainer config={chartConfig} className="h-[240px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 0, right: 0 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              domain={[yMin, yMax]}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  className="w-fit min-w-fit"
                  formatter={(value, _name, item) => (
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: item.payload.fill }}
                      />
                      <span className="text-muted-foreground mr-1">
                        {item.payload.name}
                      </span>
                      <span className="font-mono font-medium text-foreground tabular-nums">
                        {formatAmount(Number(value), currency)}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={64}>
              {chartData.map((entry) => (
                <Cell key={entry.key} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      ) : (
        <p className="flex h-full min-h-[240px] items-center justify-center text-sm text-muted-foreground">
          No leftover or savings recorded this month.
        </p>
      )}
    </DashboardCard>
  );
}
