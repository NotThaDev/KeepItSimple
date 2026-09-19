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

export interface DailyCumulativeExpense {
  day: number;
  thisMonth: number | null;
  lastMonth: number | null;
}

export interface MonthlyExpenseComparison {
  month: number;
  thisYear: number | null;
  lastYear: number;
}

export interface ExpenseAnalytics {
  totalMonthlyExpenses: number;
  previousMonthExpenses: number;
  dailyBurn: number;
  monthProjection: number;
  monthlyIncome: number;
  spendingRate: number;
  projectedSpendingRate: number;
  previousMonthSpendingRate: number;
  fixedExpenses: number;
  topExpenses: Transaction[];
  expensePerDay: Record<string, number>;
  expenseByCategory: TransactionByCategory[];
  monthlySpendingPace: DailyCumulativeExpense[];
  monthlySpendComparison: MonthlyExpenseComparison[];
  expensePerPocket: TransactionPerPocket[];
}

export async function getExpenseAnalytics(): Promise<
  FetchWrapperResponse<ExpenseAnalytics>
> {
  const expense = await get<ExpenseAnalytics>("/api/analytics/expense");

  if (expense.data) {
    expense.data.topExpenses = (expense.data.topExpenses ?? []).map(
      (transaction) => ({
        ...transaction,
        date: new Date(transaction.date),
      }),
    );
  }

  return expense;
}
