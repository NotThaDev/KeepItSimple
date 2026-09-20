"use client";

import { DashboardCard } from "@/app/dashboard/cards/DashboardCard";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { LayoutGrid } from "lucide-react";
import { useMemo } from "react";
import { useExpenseAnalytics } from "@/stores/analytics";
import { formatMoney } from "../utils";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HEAT_STOPS = ["#fee2e2", "#fecaca", "#f87171", "#dc2626", "#7f1d1d"];
const CELL_WIDTH = 65;
const CELL_HEIGHT = 20;

function getDayAmount(
  expensePerDay: Record<string, number>,
  day: number,
): number {
  return Math.abs(expensePerDay[String(day)] ?? 0);
}

function getHeatIntensity(amount: number, maxAmount: number): number {
  if (amount <= 0 || maxAmount <= 0) {
    return 0;
  }

  return Math.log1p(amount) / Math.log1p(maxAmount);
}

function mixHeatColor(intensity: number): string {
  const stops = HEAT_STOPS.length - 1;
  const scaled = intensity * stops;
  const index = Math.min(stops - 1, Math.floor(scaled));
  const t = scaled - index;
  const from = hexToRgb(HEAT_STOPS[index]);
  const to = hexToRgb(HEAT_STOPS[index + 1]);

  return `rgb(${Math.round(from[0] + (to[0] - from[0]) * t)} ${Math.round(from[1] + (to[1] - from[1]) * t)} ${Math.round(from[2] + (to[2] - from[2]) * t)})`;
}

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function getHeatStyle(amount: number, maxAmount: number) {
  const intensity = getHeatIntensity(amount, maxAmount);

  return { backgroundColor: mixHeatColor(intensity) };
}

function buildMonthWeeks(now: Date): Array<Array<number | null>> {
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const cells: Array<number | null> = [
    ...Array<number | null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const weeks: Array<Array<number | null>> = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }

  return weeks;
}

export function ExpenseDensity() {
  const { analytics, currency } = useExpenseAnalytics();
  const now = useMemo(() => new Date(), []);
  const weeks = useMemo(() => buildMonthWeeks(now), [now]);
  const today = now.getDate();
  const maxAmount = useMemo(() => {
    return Math.max(
      0,
      ...Object.values(analytics.expensePerDay ?? {}).map((value) =>
        Math.abs(value),
      ),
    );
  }, [analytics.expensePerDay]);

  return (
    <DashboardCard title="Expense density" icon={LayoutGrid} className="h-auto">
      <TooltipProvider>
        <div className="mt-2 flex min-h-0 flex-1 flex-col items-center justify-center gap-3">
          <div
            className="grid w-fit gap-1.5"
            style={{
              gridTemplateColumns: `auto repeat(7, ${CELL_WIDTH}px)`,
            }}
          >
            <span />
            {WEEKDAY_LABELS.map((label) => (
              <span
                key={label}
                className="text-center text-[10px] font-medium text-muted-foreground"
              >
                {label}
              </span>
            ))}

            {weeks.map((week, weekIndex) => (
              <WeekRow
                key={`week-${weekIndex}`}
                week={week}
                weekIndex={weekIndex}
                today={today}
                now={now}
                currency={currency}
                expensePerDay={analytics.expensePerDay ?? {}}
                maxAmount={maxAmount}
              />
            ))}
          </div>

          <div className="mt-auto flex items-center justify-end gap-1.5 pt-1 text-[11px] text-muted-foreground">
            <span>Less</span>
            {HEAT_STOPS.map((color) => (
              <span
                key={color}
                className="size-3 rounded-sm"
                style={{ backgroundColor: color }}
                aria-label="Spend intensity"
              />
            ))}
            <span>More</span>
          </div>
        </div>
      </TooltipProvider>
    </DashboardCard>
  );
}

function WeekRow({
  week,
  weekIndex,
  today,
  now,
  currency,
  expensePerDay,
  maxAmount,
}: Readonly<{
  week: Array<number | null>;
  weekIndex: number;
  today: number;
  now: Date;
  currency: string;
  expensePerDay: Record<string, number>;
  maxAmount: number;
}>) {
  return (
    <>
      <span
        className="flex items-center pr-2 text-[10px] font-medium text-muted-foreground"
        style={{ height: `${CELL_HEIGHT}px` }}
      >
        W{weekIndex + 1}
      </span>
      {week.map((day, dayIndex) => {
        if (day == null) {
          return (
            <span
              key={`empty-${weekIndex}-${dayIndex}`}
              style={{ height: `${CELL_HEIGHT}px`, width: `${CELL_WIDTH}px` }}
            />
          );
        }

        const amount = getDayAmount(expensePerDay, day);
        const isToday = day === today;
        const cellDate = new Date(now.getFullYear(), now.getMonth(), day);

        return (
          <Tooltip key={day}>
            <TooltipTrigger asChild>
              <button
                type="button"
                className={cn(
                  "rounded-sm",
                  isToday &&
                    "ring-2 ring-foreground ring-offset-1 ring-offset-background",
                )}
                style={{
                  ...getHeatStyle(amount, maxAmount),
                  height: `${CELL_HEIGHT}px`,
                  width: `${CELL_WIDTH}px`,
                }}
                aria-label={`${format(cellDate, "d MMMM")}: ${formatMoney(amount, currency)}`}
              />
            </TooltipTrigger>
            <TooltipContent side="top">
              {format(cellDate, "d MMM")} · {formatMoney(amount, currency)}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </>
  );
}
