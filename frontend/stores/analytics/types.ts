import type { FetchWrapperResponse } from "@/lib/fetchWrapper";
import type { IncomeAnalytics } from "@/lib/models/Analytics";
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
  currency: string;
  isLoading: boolean;
}

export interface AnalyticsProviderProps {
  incomeResponse: FetchWrapperResponse<IncomeAnalytics>;
  view: AnalyticsView;
  children: ReactNode;
}
