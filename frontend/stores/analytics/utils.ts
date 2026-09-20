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

export function parseAnalyticsView(paramKeys: Iterable<string>): AnalyticsView {
  const keys = new Set(paramKeys);
  return (
    Object.values(AnalyticsView).find((view) => keys.has(view)) ??
    AnalyticsView.Income
  );
}

export function toAnalyticsHref(pathname: string, view: AnalyticsView): string {
  return `${pathname}?${view}`;
}

export async function loadAnalytics(
  view: AnalyticsView,
): Promise<AnalyticsPayload> {
  if (view === AnalyticsView.Expense) {
    const { data } = await getExpenseAnalytics();
    return { view, analytics: data };
  }

  if (view === AnalyticsView.Income) {
    const { data } = await getIncomeAnalytics();
    return { view, analytics: data };
  }

  if (view === AnalyticsView.Saving) {
    const { data } = await getSavingAnalytics();
    return { view, analytics: data };
  }

  return { view: AnalyticsView.Income, analytics: undefined };
}
