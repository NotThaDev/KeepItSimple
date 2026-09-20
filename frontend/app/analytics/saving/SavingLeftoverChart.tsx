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
import { formatAmount } from "@/lib/helpers/currencyHelper";
import { useSavingAnalytics } from "@/stores/analytics";
import { BarChart3 } from "lucide-react";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { MONTH_LABELS } from "../utils";

function getAxisDomain(values: number[]): [number, number] {
  if (values.length === 0) {
    return [0, 1];
  }

  return [
    Math.min(0, Math.floor(Math.min(...values) * 1.1)),
    Math.max(1, Math.ceil(Math.max(...values, 0) * 1.1)),
  ];
}

const chartConfig: ChartConfig = {
  leftover: {
    label: "Leftover",
    theme: {
      light: "#2563eb",
      dark: "#60a5fa",
    },
  },
  saved: {
    label: "Saved",
    theme: {
      light: "#0f766e",
      dark: "#14b8a6",
    },
  },
};

const SERIES_SWATCH: Record<string, string> = {
  leftover: "#60a5fa",
  saved: "#14b8a6",
};

export function SavingLeftoverChart() {
  const { analytics, currency } = useSavingAnalytics();
  const chartData = useMemo(() => {
    return analytics.monthlySavings.map((entry) => ({
      month: MONTH_LABELS[entry.month - 1] ?? String(entry.month),
      leftover: entry.leftover ?? 0,
      saved: entry.saved ?? 0,
    }));
  }, [analytics.monthlySavings]);

  const hasValues = chartData.some(
    (entry) => entry.leftover !== 0 || entry.saved !== 0,
  );
  const [yMin, yMax] = getAxisDomain(
    chartData.flatMap((entry) => [entry.leftover, entry.saved]),
  );

  return (
    <DashboardCard
      title="Leftover vs Saved - 12 months"
      icon={BarChart3}
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
              dataKey="month"
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
                  className="w-fit min-w-fit"
                  formatter={(value, name) => {
                    const key = String(name);
                    const label = key === "leftover" ? "Leftover" : "Saved";

                    return (
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor: SERIES_SWATCH[key] ?? "#94a3b8",
                          }}
                        />
                        <span className="text-muted-foreground mr-1">
                          {label}
                        </span>
                        <span className="font-mono font-medium text-foreground tabular-nums">
                          {formatAmount(Number(value), currency)}
                        </span>
                      </div>
                    );
                  }}
                />
              }
            />
            <Bar
              dataKey="leftover"
              fill="var(--color-leftover)"
              maxBarSize={28}
            />
            <Bar dataKey="saved" fill="var(--color-saved)" maxBarSize={28} />
            <ChartLegend content={<ChartLegendContent />} />
          </BarChart>
        </ChartContainer>
      ) : (
        <p className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
          No leftover or savings recorded this year.
        </p>
      )}
    </DashboardCard>
  );
}
