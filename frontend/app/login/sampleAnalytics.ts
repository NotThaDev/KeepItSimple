import { ExpenseByCategory, OverviewAnalytics } from "@/lib/models/Analytics";
import { TransactionCategory } from "@/lib/models/Transaction";

// Fixed showcase numbers: no randomness, so server and client render the same.
export const SAMPLE_CATEGORIES: ExpenseByCategory[] = [
  { category: TransactionCategory.Food, total: -420 },
  { category: TransactionCategory.Transport, total: -180 },
  { category: TransactionCategory.Entertainment, total: -140 },
  { category: TransactionCategory.Utilities, total: -210 },
  { category: TransactionCategory.Shopping, total: -260 },
];

const dailyComparison = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  return {
    day,
    thisMonth: Math.round(day * 38 + 60 * Math.sin(day / 3)),
    lastMonth: Math.round(day * 45 + 50 * Math.cos(day / 4)),
  };
});

export const SAMPLE_ANALYTICS: OverviewAnalytics = {
  totalExpenses: -1210,
  totalIncome: 2350,
  monthlyTotalExpenses: -1140,
  monthlyTotalIncome: 2350,
  previousMonthTotalExpenses: -1350,
  previousMonthTotalIncome: 2350,
  monthlyExpensesDailyComparison: dailyComparison,
  monthlyExpensesByCategory: SAMPLE_CATEGORIES,
  expensesPerPocket: [],
  currentMonthTotalBalance: 12480,
  previousMonthTotalBalance: 11840,
};
