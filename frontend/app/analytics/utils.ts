import { getCurrencySymbolFromCode } from "@/lib/helpers/currencyHelper";
import { AnalyticsKind } from "@/lib/models/Analytics";

export function formatMoney(amount: number, currency: string): string {
  const symbol = getCurrencySymbolFromCode(currency);
  const formatted = Math.abs(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${amount < 0 ? "-" : ""}${symbol}${formatted}`;
}

export function isFavorableChange(
  kind: AnalyticsKind,
  changeAmount: number,
): boolean {
  const increaseIsGood = kind !== AnalyticsKind.Spending;
  return changeAmount >= 0 ? increaseIsGood : !increaseIsGood;
}

export function kindNoun(kind: AnalyticsKind): string {
  switch (kind) {
    case AnalyticsKind.Income:
      return "income";
    case AnalyticsKind.Spending:
      return "spending";
    case AnalyticsKind.Savings:
      return "savings";
    case AnalyticsKind.Investments:
      return "investments";
    case AnalyticsKind.Interest:
      return "interest";
  }
}
