"use client";

import { Selection } from "@/components/common/selector/Selection";
import {
  ANALYTICS_MONTH_ITEMS,
  ANALYTICS_VIEW_ITEMS,
  AnalyticsView,
  useAnalytics,
} from "@/stores/analytics";

export function AnalyticsViewSelector() {
  const { view, setView, month, setMonth } = useAnalytics();
  const currentMonth = new Date().getMonth() + 1;
  const monthItems = ANALYTICS_MONTH_ITEMS.filter(
    (item) => Number(item.value) <= currentMonth,
  );

  return (
    <div className="flex shrink-0 items-center justify-end gap-2">
      <Selection
        className="w-[160px]"
        items={monthItems}
        value={String(month)}
        onChange={(value) => setMonth(Number(value))}
      />
      <Selection
        className="w-[220px]"
        items={ANALYTICS_VIEW_ITEMS}
        value={view}
        onChange={(value) => setView(value as AnalyticsView)}
      />
    </div>
  );
}
