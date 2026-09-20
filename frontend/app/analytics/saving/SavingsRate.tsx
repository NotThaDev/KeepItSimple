"use client";

import { DashboardCard } from "@/app/dashboard/cards/DashboardCard";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useSavingAnalytics } from "@/stores/analytics";
import { LayoutGrid } from "lucide-react";
import { useMemo } from "react";
import { MONTH_LABELS, formatPercent, getHeatStyle } from "../utils";

const HEAT_STOPS = ["#ccfbf1", "#99f6e4", "#2dd4bf", "#14b8a6", "#0f766e"];

export function SavingsRate() {
  const { analytics } = useSavingAnalytics();
  const currentMonth = useMemo(() => new Date().getMonth() + 1, []);
  const maxRate = useMemo(
    () =>
      Math.max(
        0,
        ...analytics.monthlySavings.map((entry) => entry.savingRate ?? 0),
      ),
    [analytics.monthlySavings],
  );

  return (
    <DashboardCard title="Savings rate - 12 months" icon={LayoutGrid}>
      <TooltipProvider>
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6">
          <div className="grid w-full grid-cols-12 gap-1.5">
            {analytics.monthlySavings.map((entry) => {
              const rate = entry.savingRate ?? 0;
              const monthLabel =
                MONTH_LABELS[entry.month - 1] ?? String(entry.month);
              const isCurrent = entry.month === currentMonth;

              return (
                <div
                  key={entry.month}
                  className="flex min-w-0 flex-col items-center gap-1.5"
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "h-7 w-full rounded-sm",
                          isCurrent &&
                            "ring-2 ring-foreground ring-offset-1 ring-offset-background",
                        )}
                        style={getHeatStyle(rate, maxRate, HEAT_STOPS)}
                        aria-label={`${monthLabel}: ${formatPercent(rate)}`}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {monthLabel} · {formatPercent(rate)}
                    </TooltipContent>
                  </Tooltip>
                  <span className="text-[12px] font-medium text-muted-foreground">
                    {monthLabel}
                  </span>
                </div>
              );
            })}
          </div>

          <div className=" flex flex-col items-center gap-1.5 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span>Less</span>
              {HEAT_STOPS.map((color) => (
                <span
                  key={color}
                  className="size-3 rounded-sm"
                  style={{ backgroundColor: color }}
                  aria-label="Savings rate intensity"
                />
              ))}
              <span>More</span>
            </div>
          </div>
        </div>
      </TooltipProvider>
    </DashboardCard>
  );
}
