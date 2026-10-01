import { TransactionCategory } from "@/lib/models/Transaction";

export function formatPercent(ratio: number): string {
  return `${(ratio * 100).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}%`;
}

export const PASSIVE_INCOME_CATEGORIES = [
  TransactionCategory.Interest,
  TransactionCategory.Dividends,
  TransactionCategory.RentalIncome,
];

export const ACTIVE_INCOME_CATEGORIES = [
  TransactionCategory.Salary,
  TransactionCategory.Bonus,
  TransactionCategory.Freelance,
  TransactionCategory.Business,
];

export const FIXED_EXPENSE_CATEGORIES = [
  TransactionCategory.Lease,
  TransactionCategory.Rent,
  TransactionCategory.Mortgage,
  TransactionCategory.Loan,
  TransactionCategory.Insurance,
  TransactionCategory.Phone,
  TransactionCategory.Subscriptions,
];

export const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function getHeatIntensity(value: number, maxValue: number): number {
  if (value <= 0 || maxValue <= 0) {
    return 0;
  }

  return Math.log1p(value) / Math.log1p(maxValue);
}

export function mixHeatColor(
  intensity: number,
  stops: readonly string[],
): string {
  const lastIndex = stops.length - 1;
  const scaled = intensity * lastIndex;
  const index = Math.min(lastIndex - 1, Math.floor(scaled));
  const t = scaled - index;
  const from = hexToRgb(stops[index]);
  const to = hexToRgb(stops[index + 1]);

  return `rgb(${Math.round(from[0] + (to[0] - from[0]) * t)} ${Math.round(from[1] + (to[1] - from[1]) * t)} ${Math.round(from[2] + (to[2] - from[2]) * t)})`;
}

export function getHeatStyle(
  value: number,
  maxValue: number,
  stops: readonly string[],
): { backgroundColor: string } {
  return {
    backgroundColor: mixHeatColor(getHeatIntensity(value, maxValue), stops),
  };
}

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}
