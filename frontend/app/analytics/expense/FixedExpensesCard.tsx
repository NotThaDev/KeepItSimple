"use client";

import { DashboardCard } from "@/app/dashboard/cards/DashboardCard";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Pin } from "lucide-react";
import { Cell, Label, Pie, PieChart } from "recharts";
import { useActiveExpenseAnalytics } from "@/stores/analytics";
import { formatMoney, formatPercent } from "../utils";

const chartConfig: ChartConfig = {
  fixed: {
    label: "Fixed",
    theme: {
      light: "#dc2626",
      dark: "#ef4444",
    },
  },
  variable: {
    label: "Variable",
    theme: {
      light: "#cbd5e1",
      dark: "#64748b",
    },
  },
};

export function FixedExpensesCard() {
  const { analytics, currency } = useActiveExpenseAnalytics();
  const fixed = Math.abs(analytics.fixedExpenses);
  const variable = Math.max(0, analytics.totalMonthlyExpenses - fixed);
  const total = fixed + variable;
  const fixedShare = total === 0 ? 0 : fixed / total;
  const chartData = [
    {
      key: "fixed",
      name: "Fixed",
      total: fixed,
      fill: "var(--color-fixed)",
      swatch: "#ef4444",
    },
    {
      key: "variable",
      name: "Variable",
      total: variable,
      fill: "var(--color-variable)",
      swatch: "#64748b",
    },
  ].filter((entry) => entry.total > 0);

  return (
    <DashboardCard title="Fixed vs variable" icon={Pin}>
      {chartData.length === 0 ? (
        <p className="mt-2 flex h-full min-h-[220px] items-center justify-center text-sm text-muted-foreground">
          No expenses recorded this month.
        </p>
      ) : (
        <div className="mt-2 flex h-full min-h-0 w-full flex-col">
          <div className="flex min-h-0 w-full items-center gap-4">
            <ChartContainer
              config={chartConfig}
              className="aspect-square size-[200px] shrink-0"
            >
              <PieChart>
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
                <Pie
                  data={chartData}
                  dataKey="total"
                  nameKey="key"
                  innerRadius={62}
                  outerRadius={82}
                  paddingAngle={4}
                  cornerRadius={6}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.key} fill={entry.fill} />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-xl font-bold"
                            >
                              {formatPercent(fixedShare)}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 20}
                              className="fill-muted-foreground"
                            >
                              Fixed
                            </tspan>
                          </text>
                        );
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="flex min-h-0 flex-1 flex-col gap-3">
              {chartData.map((entry) => (
                <div
                  key={entry.key}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex min-w-0 items-center">
                    <span
                      className="mr-2 size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: entry.swatch }}
                    />
                    <p className="font-semibold">{entry.name}</p>
                  </div>
                  <p className="shrink-0 rounded-md bg-secondary px-2 py-0.5 text-secondary-foreground">
                    {formatMoney(entry.total, currency)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </DashboardCard>
  );
}
