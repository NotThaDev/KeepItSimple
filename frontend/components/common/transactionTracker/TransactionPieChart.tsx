"use client";

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
import { formatAmount } from "@/lib/helpers/currencyHelper";
import { ExpenseByCategory } from "@/lib/models/Analytics";
import {
  formatCategoryLabel,
  TransactionCategory,
} from "@/lib/models/Transaction";
import { SquircleDashed } from "lucide-react";
import { useMemo } from "react";
import { Label, Pie, PieChart } from "recharts";

export const description = "A donut chart with text";

interface TransactionPieChartProps {
  categories: ExpenseByCategory[];
  currency?: string;
  label?: string;
}

export function TransactionPieChart({
  categories,
  currency,
  label = "Expenses",
}: Readonly<TransactionPieChartProps>) {
  const chartData = useMemo(() => {
    return categories
      .map((entry) => ({
        category: entry.category,
        total: Math.abs(entry.total),
        fill:
          CategoryColorMap[entry.category]?.background ??
          DEFAULT_CATEGORY_COLORS.background,
      }))
      .filter((entry) => entry.total > 0);
  }, [categories]);

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {
      total: {
        label,
      },
    };

    chartData.forEach((entry) => {
      config[entry.category] = {
        label: formatCategoryLabel(entry.category),
        color: entry.fill,
      };
    });

    return config;
  }, [chartData, label]);

  const total = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.total, 0);
  }, [chartData]);

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-square size-[220px] shrink-0 self-start"
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
                  <span className="text-muted-foreground mr-1">
                    {formatCategoryLabel(name as TransactionCategory)}
                  </span>
                  <span className="font-mono font-medium text-foreground tabular-nums">
                    {formatAmount(Number(value), currency)}
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
          innerRadius={80}
          outerRadius={100}
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
                      {formatAmount(total, currency, 0)}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 30}
                      className="fill-muted-foreground"
                    >
                      {label}
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
