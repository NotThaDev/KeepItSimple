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
import { PeriodInsight } from "@/lib/models/Analytics";
import {
  formatCategoryLabel,
  TransactionCategory,
} from "@/lib/models/Transaction";
import { BanknoteX, PieChart as PieChartIcon, SquircleDashed } from "lucide-react";
import { useMemo } from "react";
import { Label, Pie, PieChart } from "recharts";
import { formatMoney, kindNoun } from "../utils";

interface InsightCategoryChartProps {
  insight: PeriodInsight;
}

export function InsightCategoryChart({
  insight,
}: Readonly<InsightCategoryChartProps>) {
  const chartData = useMemo(() => {
    return insight.byCategory
      .map((entry) => ({
        category: entry.category,
        total: Math.abs(entry.total),
        fill:
          CategoryColorMap[entry.category]?.background ??
          DEFAULT_CATEGORY_COLORS.background,
      }))
      .filter((entry) => entry.total > 0);
  }, [insight.byCategory]);

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {
      total: {
        label: formatCategoryLabelTitle(insight),
      },
    };

    chartData.forEach((entry) => {
      config[entry.category] = {
        label: formatCategoryLabel(entry.category),
        color: entry.fill,
      };
    });

    return config;
  }, [chartData, insight]);

  const total = useMemo(() => {
    return chartData.reduce((sum, entry) => sum + entry.total, 0);
  }, [chartData]);

  return (
    <DashboardCard title="By category" icon={PieChartIcon}>
      {chartData.length > 0 ? (
        <div className="flex h-full min-h-0 w-full items-start gap-4">
          <ChartContainer config={chartConfig} className="aspect-square max-w-[240px] flex-1">
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
                          {formatMoney(Number(value), insight.currency)}
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
                            {formatMoney(total, insight.currency)}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 22}
                            className="fill-muted-foreground"
                          >
                            {formatCategoryLabelTitle(insight)}
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
              {formatCategoryLabelTitle(insight)} by category
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
                  {formatMoney(entry.total, insight.currency)}
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
            <p className="text-base font-semibold">No categories yet</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {`There is no ${kindNoun(insight.kind)} to break down for this period.`}
            </p>
          </div>
        </div>
      )}
    </DashboardCard>
  );
}

function formatCategoryLabelTitle(insight: PeriodInsight): string {
  const noun = kindNoun(insight.kind);
  return noun.charAt(0).toUpperCase() + noun.slice(1);
}
