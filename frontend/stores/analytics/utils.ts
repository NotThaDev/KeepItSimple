import { AnalyticsView } from "./types";

export const ANALYTICS_VIEW_ITEMS: {
  value: AnalyticsView;
  label: string;
  disabled?: boolean;
}[] = [
  { value: AnalyticsView.Income, label: "Income Analytics" },
  { value: AnalyticsView.Expense, label: "Expense Analytics", disabled: true },
  { value: AnalyticsView.Saving, label: "Saving Analytics", disabled: true },
];

// We'll update this when the new analytics views are implemented
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function parseAnalyticsView(paramKeys: Iterable<string>): AnalyticsView {
  // const keys = new Set(paramKeys);
  // For now we always return AnalyticsView.Income
  return AnalyticsView.Income;
  // return (
  //   Object.values(AnalyticsView).find((view) => keys.has(view)) ??
  //   AnalyticsView.Income
  // );
}

export function toAnalyticsHref(pathname: string, view: AnalyticsView): string {
  return `${pathname}?${view}`;
}
