"use client";

import { DashboardCard } from "@/app/dashboard/cards/DashboardCard";
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
import {
  formatCategoryLabel,
  TransactionCategory,
} from "@/lib/models/Transaction";
import { BanknoteX, PieChart as PieChartIcon, SquircleDashed } from "lucide-react";
import { useMemo } from "react";
import { Label, Pie, PieChart } from "recharts";
import { useActiveAnalytics } from "@/stores/analytics";
import { formatMoney } from "../utils";

export function IncomeCategoryChart() {
  const { analytics, currency } = useActiveAnalytics();
  const chartData = useMemo(() => {
    return analytics.monthlyIncomeByCategory
      .map((entry) => ({
        category: entry.category,
        total: Math.abs(entry.total),
        fill:
          CategoryColorMap[entry.category]?.background ??
          DEFAULT_CATEGORY_COLORS.background,
      }))
      .filter((entry) => entry.total > 0);
  }, [analytics.monthlyIncomeByCategory]);

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {
      total: {
        label: "Income",
      },
    };

    chartData.forEach((entry) => {
      config[entry.category] = {
        label: formatCategoryLabel(entry.category),
        color: entry.fill,
      };
    });

    return config;
  }, [chartData]);

  const total = useMemo(() => {
    return chartData.reduce((sum, entry) => sum + entry.total, 0);
  }, [chartData]);

  return (
    <DashboardCard title="Income by category" icon={PieChartIcon} className="h-auto min-h-[20rem]">
      {chartData.length > 0 ? (
        <div className="flex h-full min-h-0 w-full items-start gap-4">
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
                nameKey="category"
                innerRadius={70}
                outerRadius={90}
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
                            className="fill-foreground text-xl font-bold"
                          >
                            {formatMoney(total, currency)}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 22}
                            className="fill-muted-foreground"
                          >
                            Income
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
            <p className="mb-1 text-sm text-muted-foreground">
              This month by category
            </p>
            {chartData.map((entry) => (
              <div
                key={entry.category}
                className="flex items-center justify-between gap-2"
              >
                <div className="flex min-w-0 items-center">
                  <SquircleDashed
                    className="mr-2 shrink-0"
                    size={18}
                    color={entry.fill}
                  />
                  <p className="truncate font-semibold">
                    {formatCategoryLabel(entry.category)}
                  </p>
                </div>
                <p className="shrink-0 rounded-md bg-secondary px-2 py-0.5 text-secondary-foreground">
                  {formatMoney(entry.total, currency)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex h-full min-h-[240px] w-full items-center justify-center">
          <div className="flex max-w-sm flex-col items-center gap-3 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/15">
              <BanknoteX className="size-6" />
            </div>
            <p className="text-base font-semibold">No income yet</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Income recorded this month will appear here by category.
            </p>
          </div>
        </div>
      )}
    </DashboardCard>
  );
}
