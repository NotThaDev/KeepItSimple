"use client";

import { DashboardCard } from "@/app/dashboard/cards/DashboardCard";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ArrowLeftRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { useIncomeAnalytics } from "@/stores/analytics";
import { formatMoney } from "../utils";

const chartConfig: ChartConfig = {
  income: {
    label: "Income",
    theme: {
      light: "#16a34a",
      dark: "#22c55e",
    },
  },
  expenses: {
    label: "Expenses",
    theme: {
      light: "#dc2626",
      dark: "#ef4444",
    },
  },
  net: {
    label: "Net",
    theme: {
      light: "#2563eb",
      dark: "#60a5fa",
    },
  },
};

export function IncomeCashFlowChart() {
  const { analytics, currency } = useIncomeAnalytics();
  const chartData = [
    {
      key: "income",
      name: "Income",
      value: analytics.totalMonthlyIncome,
      fill: "var(--color-income)",
    },
    {
      key: "expenses",
      name: "Expenses",
      value: analytics.monthlyExpenses,
      fill: "var(--color-expenses)",
    },
    {
      key: "net",
      name: "Net",
      value: analytics.netMonthlyIncome,
      fill: "var(--color-net)",
    },
  ];

  const hasValues = chartData.some((entry) => entry.value !== 0);
  const values = chartData.map((entry) => entry.value);
  const yMax = Math.max(1, Math.ceil(Math.max(...values, 0) * 1.1));
  const yMin = Math.min(0, Math.floor(Math.min(...values, 0) * 1.1));

  return (
    <DashboardCard
      title="Monthly cash flow"
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
                        {formatMoney(Number(value), currency)}
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
          No cash flow recorded this month.
        </p>
      )}
    </DashboardCard>
  );
}
