"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useTransition,
} from "react";
import type { AnalyticsContextValue, AnalyticsProviderProps } from "./types";
import { AnalyticsView } from "./types";
import { toAnalyticsHref } from "./utils";

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

export function AnalyticsProvider({
  analytics,
  view,
  month,
  children,
}: Readonly<AnalyticsProviderProps>) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const setView = useCallback(
    (nextView: AnalyticsView) => {
      startTransition(() => {
        router.replace(toAnalyticsHref(pathname, nextView, month), {
          scroll: false,
        });
      });
    },
    [month, pathname, router],
  );

  const setMonth = useCallback(
    (nextMonth: number) => {
      startTransition(() => {
        router.replace(toAnalyticsHref(pathname, view, nextMonth), {
          scroll: false,
        });
      });
    },
    [pathname, router, view],
  );

  const value = useMemo((): AnalyticsContextValue => {
    const base = { setView, setMonth, month, isLoading: isPending };

    if (view === AnalyticsView.Expense) {
      return {
        ...base,
        view,
        analytics,
        currency: analytics?.expensePerPocket[0]?.pocket.currency ?? "EUR",
      };
    }

    if (view === AnalyticsView.Income) {
      return {
        ...base,
        view,
        analytics,
        currency:
          analytics?.monthlyIncomePerPocket[0]?.pocket.currency ?? "EUR",
      };
    }

    return {
      ...base,
      view,
      analytics,
      currency: analytics?.currency ?? "EUR",
    };
  }, [analytics, isPending, month, setMonth, setView, view]);

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

export function useIncomeAnalytics() {
  const { view, analytics, currency, month } = useAnalytics();
  if (view !== AnalyticsView.Income || analytics == undefined) {
    throw new Error("useIncomeAnalytics requires loaded income analytics");
  }

  return { analytics, currency, month };
}

export function useExpenseAnalytics() {
  const { view, analytics, currency, month } = useAnalytics();
  if (view !== AnalyticsView.Expense || analytics == undefined) {
    throw new Error("useExpenseAnalytics requires loaded expense analytics");
  }

  return { analytics, currency, month };
}

export function useSavingAnalytics() {
  const { view, analytics, currency, month } = useAnalytics();
  if (view !== AnalyticsView.Saving || analytics == undefined) {
    throw new Error("useSavingAnalytics requires loaded saving analytics");
  }

  return { analytics, currency, month };
}
