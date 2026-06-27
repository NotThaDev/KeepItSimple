"use client";

import { Label, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  CategoryColorMap,
  DEFAULT_CATEGORY_COLORS,
} from "@/lib/helpers/colors";
import { Analytics } from "@/lib/models/Analytics";
import { useMemo } from "react";
import { SquircleDashed } from "lucide-react";
import { TransactionCategory } from "@/lib/models/Transaction";

export const description = "A donut chart with text";

interface ExpensesPieChartProps {
  analytics: Analytics;
}

export function ExpensesPieChart({
  analytics,
}: Readonly<ExpensesPieChartProps>) {
  const chartData = useMemo(() => {
    return analytics.monthlyExpensesByCategory
      .map((entry) => ({
        category: entry.category,
        total: Math.abs(entry.total),
        fill:
          CategoryColorMap[entry.category]?.background ??
          DEFAULT_CATEGORY_COLORS.background,
      }))
      .filter((entry) => entry.total > 0);
  }, [analytics.monthlyExpensesByCategory]);

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {
      total: {
        label: "Expenses",
      },
    };

    chartData.forEach((entry) => {
      config[entry.category] = {
        label: entry.category,
        color: entry.fill,
      };
    });

    return config;
  }, [chartData]);

  const totalExpenses = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.total, 0);
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <div className="flex w-[250px] items-center justify-center rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        No monthly expenses data.
      </div>
    );
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-square max-h-[280px] w-[280px]"
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              hideLabel
              className="w-fit min-w-fit"
              formatter={(value, name) => (
                <div className="flex items-center gap-1">
                  <SquircleDashed
                    size={14}
                    color={
                      CategoryColorMap[name as TransactionCategory]
                        ?.background ?? DEFAULT_CATEGORY_COLORS.background
                    }
                  />
                  <span className="text-muted-foreground mr-1">{name}</span>
                  <span className="font-mono font-medium text-foreground tabular-nums">
                    {typeof value === "number"
                      ? value.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : String(value)}
                  </span>
                </div>
              )}
            />
          }
        />
        <Pie
          data={chartData}
          dataKey="total"
          nameKey="category"
          innerRadius={100}
          outerRadius={120}
          paddingAngle={4}
          cornerRadius={6}
        >
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
                      className="fill-foreground text-3xl font-bold"
                    >
                      {totalExpenses.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 30}
                      className="fill-muted-foreground"
                    >
                      Expenses
                    </tspan>
                  </text>
                );
              }
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}
