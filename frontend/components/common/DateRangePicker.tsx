"use client";

import { format, startOfDay, subMonths, subYears } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { type DateRange } from "react-day-picker";
import { enUS } from "react-day-picker/locale";

import { formatDateOnly } from "@/components/common/DateUtils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  from?: Date;
  to?: Date;
  onDateRangeChange?: (from: Date | undefined, to: Date) => void;
}

interface DateRangePreset {
  id: string;
  label: string;
  from?: Date;
  to: Date;
}

function getDateRangePresets(now = new Date()): DateRangePreset[] {
  const to = startOfDay(now);

  return [
    { id: "1m", label: "Last month", from: subMonths(to, 1), to },
    { id: "3m", label: "Last 3 months", from: subMonths(to, 3), to },
    { id: "9m", label: "Last 9 months", from: subMonths(to, 9), to },
    { id: "1y", label: "Last year", from: subYears(to, 1), to },
    { id: "all", label: "From the beginning", to },
  ];
}

function isSameDateOnly(left?: Date, right?: Date): boolean {
  if (!left && !right) {
    return true;
  }
  if (!left || !right) {
    return false;
  }
  return formatDateOnly(left) === formatDateOnly(right);
}

export function DateRangePicker({
  from,
  to,
  onDateRangeChange,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<DateRange | undefined>();
  const presets = useMemo(() => getDateRangePresets(), []);
  const range = draftRange ?? { from, to };
  const currentYear = new Date().getFullYear();

  const handleRangeChange = (nextRange: DateRange | undefined) => {
    if (nextRange?.from && nextRange.to) {
      setDraftRange(undefined);
      setOpen(false);
      onDateRangeChange?.(nextRange.from, nextRange.to);
      return;
    }

    setDraftRange(nextRange);
  };

  const applyPreset = (preset: DateRangePreset) => {
    setDraftRange(undefined);
    setOpen(false);
    onDateRangeChange?.(preset.from, preset.to);
  };

  const label = range.from
    ? range.to
      ? `${format(range.from, "LLL dd, y")} - ${format(range.to, "LLL dd, y")}`
      : format(range.from, "LLL dd, y")
    : range.to
      ? "From the beginning"
      : "Pick a date";

  return (
    <Popover
      modal
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setDraftRange(undefined);
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id="date"
          variant="outline"
          data-empty={!range.from && !range.to}
          className="w-[280px] shrink-0 justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
        >
          <CalendarIcon />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="end">
        <div className="flex">
          <div className="flex flex-col gap-1 border-r p-2">
            {presets.map((preset) => {
              const isActive =
                isSameDateOnly(preset.from, range.from) &&
                isSameDateOnly(preset.to, range.to);

              return (
                <Button
                  key={preset.id}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "justify-start font-normal",
                    isActive && "bg-accent text-accent-foreground",
                  )}
                  onClick={() => applyPreset(preset)}
                >
                  {preset.label}
                </Button>
              );
            })}
          </div>
          <Calendar
            mode="range"
            captionLayout="dropdown"
            locale={enUS}
            selected={range}
            onSelect={handleRangeChange}
            defaultMonth={range.from ?? range.to ?? from ?? to}
            startMonth={new Date(2000, 0)}
            endMonth={new Date(currentYear + 1, 11)}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
