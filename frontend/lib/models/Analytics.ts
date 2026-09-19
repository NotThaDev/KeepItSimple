import { FetchWrapperResponse, get } from "../fetchWrapper";
import { Pocket } from "./Pocket";
import { TransactionCategory } from "./Transaction";

export interface ExpenseByCategory {
  category: TransactionCategory;
  total: number;
}

export interface ExpensePerPocket {
  pocket: Pocket;
  total: number;
}

export interface DailyExpenseComparison {
  day: number;
  thisMonth: number;
  lastMonth: number;
}

export interface OverviewAnalytics {
  totalExpenses: number;
  totalIncome: number;
  monthlyTotalExpenses: number;
  monthlyTotalIncome: number;
  previousMonthTotalExpenses: number;
  previousMonthTotalIncome: number;
  monthlyExpensesDailyComparison: DailyExpenseComparison[];
  topExpenseCategory?: TransactionCategory;
  monthlyExpensesByCategory: ExpenseByCategory[];
  expensesPerPocket: ExpensePerPocket[];
  currentMonthTotalBalance: number;
  previousMonthTotalBalance: number;
}

export async function getOverview(): Promise<
  FetchWrapperResponse<OverviewAnalytics>
> {
  return await get<OverviewAnalytics>("/api/analytics/overview");
}
