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
  CategoryColorMap,
  DEFAULT_CATEGORY_COLORS,
} from "@/lib/helpers/colors";
import {
  formatCategoryLabel,
  INCOME_ANALYTICS_CATEGORIES,
  TransactionCategory,
} from "@/lib/models/Transaction";
import { AreaChart as AreaChartIcon } from "lucide-react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Rectangle,
  XAxis,
  YAxis,
  type BarShapeProps,
} from "recharts";
import { useActiveAnalytics } from "@/stores/analytics";
import { formatMoney } from "../utils";

const STACK_TOP_RADIUS = 4;

function isTopStackSegment(
  categories: TransactionCategory[],
  category: TransactionCategory,
  payload: Record<string, unknown> | undefined,
): boolean {
  const index = categories.indexOf(category);
  return categories
    .slice(index + 1)
    .every((next) => Number(payload?.[next] ?? 0) === 0);
}

function TopRoundedStackBar({
  categories,
  category,
  x,
  y,
  width,
  height,
  fill,
  payload,
}: BarShapeProps & {
  categories: TransactionCategory[];
  category: TransactionCategory;
}) {
  if (width == null || height == null || height <= 0) {
    return null;
  }

  return (
    <Rectangle
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      radius={
        isTopStackSegment(categories, category, payload)
          ? [STACK_TOP_RADIUS, STACK_TOP_RADIUS, 0, 0]
          : 0
      }
    />
  );
}

function getMaxValue(values: number[]): number {
  return values.length > 0
    ? Math.max(1, Math.ceil(Math.max(...values) * 1.1))
    : 1;
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function IncomeTrendChart() {
  const { analytics, currency } = useActiveAnalytics();
  const activeCategories = useMemo(() => {
    return INCOME_ANALYTICS_CATEGORIES.filter((category) =>
      analytics.twelveMonthIncomeTrend.some(
        (entry) => (entry.categories[category] ?? 0) > 0,
      ),
    );
  }, [analytics.twelveMonthIncomeTrend]);

  const chartData = useMemo(() => {
    return analytics.twelveMonthIncomeTrend.map((entry) => {
      const point: Record<string, string | number> = {
        month: MONTH_LABELS[entry.month - 1] ?? String(entry.month),
      };

      for (const category of activeCategories) {
        point[category] = entry.categories[category] ?? 0;
      }

      return point;
    });
  }, [activeCategories, analytics.twelveMonthIncomeTrend]);

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {};
    activeCategories.forEach((category) => {
      config[category] = {
        label: formatCategoryLabel(category),
        color:
          CategoryColorMap[category]?.background ??
          DEFAULT_CATEGORY_COLORS.background,
      };
    });
    return config;
  }, [activeCategories]);

  const yAxisMax = getMaxValue(
    chartData.map((entry) =>
      activeCategories.reduce(
        (sum, category) => sum + Number(entry[category] ?? 0),
        0,
      ),
    ),
  );

  return (
    <DashboardCard
      title="12-month income trend"
      icon={AreaChartIcon}
      className="h-auto shrink-0"
    >
      {activeCategories.length > 0 ? (
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 0, right: 0 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
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
                  className="w-fit min-w-fit"
                  formatter={(value, name) => {
                    const category = name as TransactionCategory;
                    const color =
                      CategoryColorMap[category]?.background ??
                      DEFAULT_CATEGORY_COLORS.background;

                    return (
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-muted-foreground mr-1">
                          {formatCategoryLabel(category)}
                        </span>
                        <span className="font-mono font-medium text-foreground tabular-nums">
                          {formatMoney(Number(value), currency)}
                        </span>
                      </div>
                    );
                  }}
                />
              }
            />
            {activeCategories.map((category) => (
              <Bar
                key={category}
                dataKey={category}
                stackId="income"
                fill={`var(--color-${category})`}
                shape={(props: BarShapeProps) => (
                  <TopRoundedStackBar
                    {...props}
                    categories={activeCategories}
                    category={category}
                  />
                )}
              />
            ))}
            <ChartLegend content={<ChartLegendContent />} />
          </BarChart>
        </ChartContainer>
      ) : (
        <p className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
          No income recorded this year to chart by month.
        </p>
      )}
    </DashboardCard>
  );
}
