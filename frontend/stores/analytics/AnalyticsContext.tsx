"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { AnalyticsContextValue, AnalyticsProviderProps } from "./types";
import { AnalyticsView } from "./types";
import { toAnalyticsHref } from "./utils";
import { FetchWrapperResponse } from "@/lib/fetchWrapper";
import { getIncomeAnalytics, IncomeAnalytics } from "@/lib/models/Analytics";

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

export function AnalyticsProvider({
  incomeResponse,
  view: viewFromUrl,
  children,
}: Readonly<AnalyticsProviderProps>) {
  const router = useRouter();
  const pathname = usePathname();
  const [view, setViewState] = useState(viewFromUrl);
  const [expenseResponse, setExpenseResponse] =
    useState<FetchWrapperResponse<IncomeAnalytics>>(incomeResponse);

  const setView = useCallback(
    async (nextView: AnalyticsView) => {
      setViewState(nextView);
      if (nextView === AnalyticsView.Expense) {
        const response = await getIncomeAnalytics();
        setExpenseResponse(response);
      }
      router.replace(toAnalyticsHref(pathname, nextView), { scroll: false });
    },
    [pathname, router],
  );

  const analytics =
    view === AnalyticsView.Income ? expenseResponse.data : undefined;
  const currency =
    analytics?.monthlyIncomePerPocket[0]?.pocket.currency ?? "EUR";
  const isLoading = view === AnalyticsView.Expense;

  const value = useMemo(
    () => ({
      view,
      setView,
      analytics,
      currency,
      isLoading,
    }),
    [analytics, currency, isLoading, setView, view],
  );

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error("useAnalytics must be used within AnalyticsProvider");
  }

  return context;
}

export function useActiveAnalytics() {
  const { analytics, currency } = useAnalytics();
  if (analytics == undefined) {
    throw new Error("useActiveAnalytics requires loaded analytics");
  }

  return { analytics, currency };
}
