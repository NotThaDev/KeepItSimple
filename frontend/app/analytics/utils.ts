import { getCurrencySymbolFromCode } from "@/lib/helpers/currencyHelper";
import { TransactionCategory } from "@/lib/models/Transaction";

export function formatMoney(amount: number, currency: string): string {
  const symbol = getCurrencySymbolFromCode(currency);
  const formatted = Math.abs(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${amount < 0 ? "-" : ""}${symbol}${formatted}`;
}

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
