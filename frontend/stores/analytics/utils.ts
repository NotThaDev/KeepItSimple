import { AnalyticsView } from "./types";

export const ANALYTICS_VIEW_ITEMS: {
  value: AnalyticsView;
  label: string;
  disabled?: boolean;
}[] = [
  { value: AnalyticsView.Income, label: "Income Analytics" },
  { value: AnalyticsView.Expense, label: "Expense Analytics" },
  { value: AnalyticsView.Saving, label: "Saving Analytics", disabled: true },
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
