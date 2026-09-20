import { FetchWrapperResponse, get } from "../fetchWrapper";
import { Pocket } from "./Pocket";
import { Transaction, TransactionCategory } from "./Transaction";

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

export interface TransactionByCategory {
  category: TransactionCategory;
  total: number;
}

export interface TransactionPerPocket {
  pocket: Pocket;
  total: number;
}

export interface MonthlyTransactionByCategory {
  month: number;
  categories: Partial<Record<TransactionCategory, number>>;
}

export interface IncomeAnalytics {
  totalMonthlyIncome: number;
  netMonthlyIncome: number;
  monthlyExpenses: number;
  previousMonthIncome: number;
  sixMonthAverageIncome: number;
  savingsRate: number;
  monthlyActiveIncome: number;
  monthlyPassiveIncome: number;
  monthlyIncomeByCategory: TransactionByCategory[];
  twelveMonthIncomeTrend: MonthlyTransactionByCategory[];
  monthlyIncomePerPocket: TransactionPerPocket[];
  topMonthlyIncome: Transaction[];
}

export async function getOverview(): Promise<
  FetchWrapperResponse<OverviewAnalytics>
> {
  return await get<OverviewAnalytics>("/api/analytics/overview");
}

export async function getIncomeAnalytics(): Promise<
  FetchWrapperResponse<IncomeAnalytics>
> {
  const income = await get<IncomeAnalytics>("/api/analytics/income");

  if (income.data) {
    income.data.topMonthlyIncome = (income.data.topMonthlyIncome ?? []).map(
      (transaction) => ({
        ...transaction,
        date: new Date(transaction.date),
      }),
    );
  }

  return income;
}

export async function getExpenseAnalytics(): Promise<
  FetchWrapperResponse<unknown>
> {
  return await get<unknown>("/api/analytics/expense");
}
