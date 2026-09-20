import type { ExpenseAnalytics, IncomeAnalytics } from "@/lib/models/Analytics";
import type { ReactNode } from "react";

export enum AnalyticsView {
  Income = "income",
  Expense = "expense",
  Saving = "saving",
}

export type AnalyticsPayload =
  | {
      view: AnalyticsView.Income;
      analytics: IncomeAnalytics | undefined;
    }
  | {
      view: AnalyticsView.Expense;
      analytics: ExpenseAnalytics | undefined;
    }
  | {
      view: AnalyticsView.Saving;
      analytics: undefined;
    };

type AnalyticsContextBase = {
  setView: (view: AnalyticsView) => void;
  currency: string;
  isLoading: boolean;
};

export type AnalyticsContextValue = AnalyticsContextBase & AnalyticsPayload;

export type AnalyticsProviderProps = AnalyticsPayload & {
  children: ReactNode;
};
