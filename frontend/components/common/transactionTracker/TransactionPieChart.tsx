"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatAmount } from "@/lib/helpers/currencyHelper";
import { ExpenseByCategory } from "@/lib/models/Analytics";
import { useCategories } from "@/stores/categories";
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
  const { byId } = useCategories();
  const chartData = useMemo(() => {
    return categories
      .map((entry) => ({
        categoryId: String(entry.categoryId),
        total: Math.abs(entry.total),
        fill: byId(entry.categoryId).color,
      }))
      .filter((entry) => entry.total > 0);
  }, [categories, byId]);

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {
      total: {
        label,
      },
    };

    chartData.forEach((entry) => {
      config[entry.categoryId] = {
        label: byId(Number(entry.categoryId)).name,
        color: entry.fill,
      };
    });

    return config;
  }, [chartData, label, byId]);

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
                    color={byId(Number(name)).color}
                  />
                  <span className="text-muted-foreground mr-1">
                    {byId(Number(name)).name}
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
          nameKey="categoryId"
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
