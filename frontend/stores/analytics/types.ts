import type { FetchWrapperResponse } from "@/lib/fetchWrapper";
import type { ExpenseAnalytics, IncomeAnalytics } from "@/lib/models/Analytics";
import type { ReactNode } from "react";

export enum AnalyticsView {
  Income = "income",
  Expense = "expense",
  Saving = "saving",
}

export interface AnalyticsContextValue {
  view: AnalyticsView;
  setView: (view: AnalyticsView) => void;
  analytics: IncomeAnalytics | undefined;
  expenseAnalytics: ExpenseAnalytics | undefined;
  currency: string;
  isLoading: boolean;
}

export interface AnalyticsProviderProps {
  incomeResponse: FetchWrapperResponse<IncomeAnalytics>;
  expenseResponse: FetchWrapperResponse<ExpenseAnalytics>;
  view: AnalyticsView;
  children: ReactNode;
}
