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
import {
  ExpenseAnalytics,
  getExpenseAnalytics,
  getIncomeAnalytics,
  IncomeAnalytics,
} from "@/lib/models/Analytics";

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

export function AnalyticsProvider({
  incomeResponse,
  expenseResponse,
  view: viewFromUrl,
  children,
}: Readonly<AnalyticsProviderProps>) {
  const router = useRouter();
  const pathname = usePathname();
  const [view, setViewState] = useState(viewFromUrl);
  const [income, setIncome] =
    useState<FetchWrapperResponse<IncomeAnalytics>>(incomeResponse);
  const [expense, setExpense] =
    useState<FetchWrapperResponse<ExpenseAnalytics>>(expenseResponse);
  const [isFetching, setIsFetching] = useState(false);

  const setView = useCallback(
    async (nextView: AnalyticsView) => {
      setViewState(nextView);
      router.replace(toAnalyticsHref(pathname, nextView), { scroll: false });

      if (nextView === AnalyticsView.Income && income.data == undefined) {
        setIsFetching(true);
        const response = await getIncomeAnalytics();
        setIncome(response);
        setIsFetching(false);
      }

      if (nextView === AnalyticsView.Expense && expense.data == undefined) {
        setIsFetching(true);
        const response = await getExpenseAnalytics();
        setExpense(response);
        setIsFetching(false);
      }
    },
    [expense.data, income.data, pathname, router],
  );

  const analytics = view === AnalyticsView.Income ? income.data : undefined;
  const expenseAnalytics =
    view === AnalyticsView.Expense ? expense.data : undefined;
  const currency =
    (view === AnalyticsView.Expense
      ? expenseAnalytics?.expensePerPocket[0]?.pocket.currency
      : analytics?.monthlyIncomePerPocket[0]?.pocket.currency) ?? "EUR";
  const isLoading =
    isFetching ||
    (view === AnalyticsView.Expense &&
      expense.data == undefined &&
      expense.error == undefined);

  const value = useMemo(
    () => ({
      view,
      setView,
      analytics,
      expenseAnalytics,
      currency,
      isLoading,
    }),
    [analytics, currency, expenseAnalytics, isLoading, setView, view],
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

export function useActiveExpenseAnalytics() {
  const { expenseAnalytics, currency } = useAnalytics();
  if (expenseAnalytics == undefined) {
    throw new Error(
      "useActiveExpenseAnalytics requires loaded expense analytics",
    );
  }

  return { analytics: expenseAnalytics, currency };
}
