import {
  getExpenseAnalytics,
  getIncomeAnalytics,
  getSavingAnalytics,
} from "@/lib/models/Analytics";
import { AnalyticsPayload, AnalyticsView } from "./types";

export const ANALYTICS_VIEW_ITEMS: {
  value: AnalyticsView;
  label: string;
  disabled?: boolean;
}[] = [
  { value: AnalyticsView.Income, label: "Income Analytics" },
  { value: AnalyticsView.Expense, label: "Expense Analytics" },
  { value: AnalyticsView.Saving, label: "Saving Analytics" },
];

export const ANALYTICS_MONTH_ITEMS: {
  value: string;
  label: string;
}[] = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export function parseAnalyticsView(paramKeys: Iterable<string>): AnalyticsView {
  const keys = new Set(paramKeys);
  return (
    Object.values(AnalyticsView).find((view) => keys.has(view)) ??
    AnalyticsView.Income
  );
}

function firstSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseAnalyticsMonth(
  searchParams: Record<string, string | string[] | undefined>,
  now = new Date(),
): number {
  const month = Number(firstSearchParam(searchParams.month));
  if (Number.isInteger(month) && month >= 1 && month <= 12) {
    return month;
  }

  return now.getMonth() + 1;
}

export function toAnalyticsHref(
  pathname: string,
  view: AnalyticsView,
  month: number,
): string {
  return `${pathname}?${view}&month=${month}`;
}

export async function loadAnalytics(
  view: AnalyticsView,
  month?: number,
): Promise<AnalyticsPayload> {
  if (view === AnalyticsView.Expense) {
    const { data } = await getExpenseAnalytics(month);
    return { view, analytics: data };
  }

  if (view === AnalyticsView.Income) {
    const { data } = await getIncomeAnalytics(month);
    return { view, analytics: data };
  }

  if (view === AnalyticsView.Saving) {
    const { data } = await getSavingAnalytics(month);
    return { view, analytics: data };
  }

  return { view: AnalyticsView.Income, analytics: undefined };
}
