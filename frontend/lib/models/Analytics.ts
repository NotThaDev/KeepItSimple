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
  monthlyExpensesByCategory: ExpenseByCategory[];
  expensesPerPocket: ExpensePerPocket[];
  currentMonthTotalBalance: number;
  previousMonthTotalBalance: number;
}

export enum AnalyticsKind {
  Income = "Income",
  Spending = "Spending",
  Savings = "Savings",
  Investments = "Investments",
  Interest = "Interest",
}

export enum AnalyticsTimeRange {
  CurrentMonth = "CurrentMonth",
  LastMonth = "LastMonth",
  Last3Months = "Last3Months",
  Last6Months = "Last6Months",
  LastYear = "LastYear",
  AllTime = "AllTime",
}

export enum AnalyticsGranularity {
  Day = "Day",
  Month = "Month",
}

export interface AmountByCategory {
  category: TransactionCategory;
  total: number;
}

export interface AmountByPocket {
  pocket: Pocket;
  total: number;
}

export interface SeriesPoint {
  label: string;
  comparisonLabel?: string;
  total: number;
  previousTotal: number;
}

export interface PeriodInsight {
  kind: AnalyticsKind;
  range: AnalyticsTimeRange;
  granularity: AnalyticsGranularity;
  from: string;
  to: string;
  comparisonFrom?: string;
  comparisonTo?: string;
  hasComparison: boolean;
  currentTotal: number;
  previousTotal: number;
  changeAmount: number;
  changePercent?: number | null;
  topCategory?: TransactionCategory;
  byCategory: AmountByCategory[];
  byPocket: AmountByPocket[];
  series: SeriesPoint[];
  currency: string;
}

export const DEFAULT_ANALYTICS_KIND = AnalyticsKind.Spending;
export const DEFAULT_ANALYTICS_RANGE = AnalyticsTimeRange.CurrentMonth;

export const ANALYTICS_KIND_ITEMS = [
  { value: AnalyticsKind.Income, label: "Income" },
  { value: AnalyticsKind.Spending, label: "Spending" },
  { value: AnalyticsKind.Savings, label: "Savings" },
  { value: AnalyticsKind.Investments, label: "Investments" },
  { value: AnalyticsKind.Interest, label: "Interest" },
];

export const ANALYTICS_RANGE_ITEMS = [
  { value: AnalyticsTimeRange.CurrentMonth, label: "Current month" },
  { value: AnalyticsTimeRange.LastMonth, label: "Last month" },
  { value: AnalyticsTimeRange.Last3Months, label: "Last 3 months" },
  { value: AnalyticsTimeRange.Last6Months, label: "Last 6 months" },
  { value: AnalyticsTimeRange.LastYear, label: "Last year" },
  { value: AnalyticsTimeRange.AllTime, label: "All time" },
];

const ANALYTICS_KINDS = Object.values(AnalyticsKind);
const ANALYTICS_RANGES = Object.values(AnalyticsTimeRange);

export function isAnalyticsKind(
  value: string | undefined,
): value is AnalyticsKind {
  return value !== undefined && ANALYTICS_KINDS.includes(value as AnalyticsKind);
}

export function isAnalyticsTimeRange(
  value: string | undefined,
): value is AnalyticsTimeRange {
  return (
    value !== undefined && ANALYTICS_RANGES.includes(value as AnalyticsTimeRange)
  );
}

export function parseAnalyticsSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): { kind: AnalyticsKind; range: AnalyticsTimeRange } {
  const kindValue = firstSearchParam(searchParams.kind);
  const rangeValue = firstSearchParam(searchParams.range);

  return {
    kind: isAnalyticsKind(kindValue) ? kindValue : DEFAULT_ANALYTICS_KIND,
    range: isAnalyticsTimeRange(rangeValue)
      ? rangeValue
      : DEFAULT_ANALYTICS_RANGE,
  };
}

export function toAnalyticsSearchParams(
  kind: AnalyticsKind,
  range: AnalyticsTimeRange,
): string {
  const params = new URLSearchParams();
  if (kind !== DEFAULT_ANALYTICS_KIND) {
    params.set("kind", kind);
  }
  if (range !== DEFAULT_ANALYTICS_RANGE) {
    params.set("range", range);
  }
  return params.toString();
}

export function comparisonRangeLabel(
  range: AnalyticsTimeRange,
): string | null {
  switch (range) {
    case AnalyticsTimeRange.CurrentMonth:
      return "last month";
    case AnalyticsTimeRange.LastMonth:
      return "the month before";
    case AnalyticsTimeRange.Last3Months:
      return "the previous 3 months";
    case AnalyticsTimeRange.Last6Months:
      return "the previous 6 months";
    case AnalyticsTimeRange.LastYear:
      return "the previous year";
    case AnalyticsTimeRange.AllTime:
      return null;
  }
}

export async function getAnalytics(): Promise<FetchWrapperResponse<Analytics>> {
  return await get<Analytics>("/api/analytics");
}

export async function getPeriodInsight(
  kind: AnalyticsKind,
  range: AnalyticsTimeRange,
): Promise<FetchWrapperResponse<PeriodInsight>> {
  const params = new URLSearchParams();
  params.set("range", range);
  return await get<PeriodInsight>(`/api/analytics/${kind}?${params.toString()}`);
}

function firstSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}
