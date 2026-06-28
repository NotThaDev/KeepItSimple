import { FetchWrapperResponse, get } from "../fetchWrapper";
import { Pocket } from "./Pocket";
import { TransactionCategory } from "./Transaction";

export interface ExpenseByCategory {
  category: TransactionCategory;
  total: number;
}

export interface ExpensePerPocket {
  pocket: Pocket;
  totalExpenses: number;
}

export interface DailyExpenseComparison {
  day: number;
  thisMonth: number;
  lastMonth: number;
}

export interface Analytics {
  totalExpenses: number;
  totalIncome: number;
  monthlyTotalExpenses: number;
  monthlyTotalIncome: number;
  previousMonthTotalExpenses: number;
  previousMonthTotalIncome: number;
  monthlyExpensesDailyComparison: DailyExpenseComparison[];
  topExpenseCategory?: TransactionCategory;
  expensesByCategory: ExpenseByCategory[];
  monthlyExpensesByCategory: ExpenseByCategory[];
  expensesPerPocket: ExpensePerPocket[];
  currentMonthTotalBalance: number;
  previousMonthTotalBalance: number;
}

export async function getAnalytics(): Promise<FetchWrapperResponse<Analytics>> {
  return await get<Analytics>("/api/analytics");
}
