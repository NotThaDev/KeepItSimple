"use client";

import { Selection } from "@/components/common/selector/Selection";
import {
  ANALYTICS_VIEW_ITEMS,
  AnalyticsView,
  useAnalytics,
} from "@/stores/analytics";

export function AnalyticsViewSelector() {
  const { view, setView } = useAnalytics();

  return (
    <div className="flex w-full shrink-0 items-center justify-end md:w-auto">
      <Selection
        className="w-full md:w-[220px]"
        items={ANALYTICS_VIEW_ITEMS}
        value={view}
        onChange={(value) => setView(value as AnalyticsView)}
      />
    </div>
  );
}
