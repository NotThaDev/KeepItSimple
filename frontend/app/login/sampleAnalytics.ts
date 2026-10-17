import { OverviewAnalytics } from "@/lib/models/Analytics";

// Fixed showcase numbers: no randomness, so server and client render the same.
const dailyComparison = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  return {
    day,
    thisMonth: Math.round(day * 38 + 60 * Math.sin(day / 3)),
    lastMonth: Math.round(day * 45 + 50 * Math.cos(day / 4)),
  };
});

export const SAMPLE_ANALYTICS: OverviewAnalytics = {
  totalExpenses: -1140,
  totalIncome: 2350,
  monthlyTotalExpenses: -1140,
  monthlyTotalIncome: 2350,
  previousMonthTotalExpenses: -1350,
  previousMonthTotalIncome: 2350,
  monthlyExpensesDailyComparison: dailyComparison,
  monthlyExpensesByCategory: [],
  expensesPerPocket: [],
  currentMonthTotalBalance: 12480,
  previousMonthTotalBalance: 11840,
};
