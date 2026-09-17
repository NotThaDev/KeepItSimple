import { endOfMonth, format, startOfMonth } from "date-fns";
import { del, FetchWrapperResponse, get, post, put } from "../fetchWrapper";

export interface Transaction {
  id: number;
  description?: string;
  amount: number;
  date: Date;
  category: TransactionCategory;
  pocketId: number;
}

export enum TransactionCategory {
  Coffe = "Coffe",
  Food = "Food",
  Transport = "Transport",
  Entertainment = "Entertainment",
  Utilities = "Utilities",
  Shopping = "Shopping",
  Health = "Health",
  Education = "Education",
  Travel = "Travel",
  Sports = "Sports",
  Subscriptions = "Subscriptions",
  Savings = "Savings",
  Investments = "Investments",
  Gifts = "Gifts",
  Love = "Love",
  Charity = "Charity",
  Other = "Other",
  Salary = "Salary",
  Bonus = "Bonus",
  Freelance = "Freelance",
  Business = "Business",
  Interest = "Interest",
  Dividends = "Dividends",
  RentalIncome = "RentalIncome",
  Refund = "Refund",
}

export const EXPENSE_TRANSACTION_CATEGORIES: TransactionCategory[] = [
  TransactionCategory.Coffe,
  TransactionCategory.Food,
  TransactionCategory.Transport,
  TransactionCategory.Entertainment,
  TransactionCategory.Utilities,
  TransactionCategory.Shopping,
  TransactionCategory.Health,
  TransactionCategory.Education,
  TransactionCategory.Travel,
  TransactionCategory.Sports,
  TransactionCategory.Subscriptions,
  TransactionCategory.Savings,
  TransactionCategory.Investments,
  TransactionCategory.Gifts,
  TransactionCategory.Love,
  TransactionCategory.Charity,
  TransactionCategory.Other,
];

export const INCOME_TRANSACTION_CATEGORIES: TransactionCategory[] = [
  TransactionCategory.Salary,
  TransactionCategory.Bonus,
  TransactionCategory.Freelance,
  TransactionCategory.Business,
  TransactionCategory.Interest,
  TransactionCategory.Dividends,
  TransactionCategory.RentalIncome,
  TransactionCategory.Refund,
];

export const DEFAULT_TRANSACTION_PAGE_SIZE = 10;
const ALL_TRANSACTION_CATEGORIES = Object.values(TransactionCategory);

export function formatCategoryLabel(category: TransactionCategory): string {
  return category.replace(/([A-Z])/g, " $1").trim();
}

export function isTransactionCategory(
  value: string | undefined,
): value is TransactionCategory {
  return (
    value !== undefined &&
    ALL_TRANSACTION_CATEGORIES.includes(value as TransactionCategory)
  );
}

export interface TransactionListQuery {
  page: number;
  pageSize: number;
  pocketId?: number;
  category?: TransactionCategory;
  from?: string;
  to?: string;
  search?: string;
}

export interface PagedTransactions {
  items: Transaction[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export function currentMonthRange(date = new Date()): {
  from: string;
  to: string;
} {
  return {
    from: format(startOfMonth(date), "yyyy-MM-dd"),
    to: format(endOfMonth(date), "yyyy-MM-dd"),
  };
}

export function parseTransactionSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): TransactionListQuery {
  const monthRange = currentMonthRange();
  const pageValue = Number(firstSearchParam(searchParams.page));
  const pageSizeValue = Number(firstSearchParam(searchParams.pageSize));
  const pocketIdValue = Number(firstSearchParam(searchParams.pocketId));
  const categoryValue = firstSearchParam(searchParams.category);
  const fromParam = firstSearchParam(searchParams.from);
  const toParam = firstSearchParam(searchParams.to);
  const hasDateParams = fromParam !== undefined || toParam !== undefined;

  return {
    page: Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1,
    pageSize:
      Number.isInteger(pageSizeValue) && pageSizeValue > 0
        ? pageSizeValue
        : DEFAULT_TRANSACTION_PAGE_SIZE,
    pocketId:
      Number.isInteger(pocketIdValue) && pocketIdValue > 0
        ? pocketIdValue
        : undefined,
    category: isTransactionCategory(categoryValue) ? categoryValue : undefined,
    from: hasDateParams
      ? isDateOnly(fromParam)
        ? fromParam
        : undefined
      : monthRange.from,
    to: hasDateParams
      ? isDateOnly(toParam)
        ? toParam
        : format(new Date(), "yyyy-MM-dd")
      : monthRange.to,
    search: firstSearchParam(searchParams.search) || undefined,
  };
}

export function toTransactionSearchParams(query: TransactionListQuery): string {
  const params = new URLSearchParams();

  if (query.page > 1) {
    params.set("page", String(query.page));
  }
  if (query.pageSize !== DEFAULT_TRANSACTION_PAGE_SIZE) {
    params.set("pageSize", String(query.pageSize));
  }
  if (query.pocketId != null) {
    params.set("pocketId", String(query.pocketId));
  }
  if (query.category) {
    params.set("category", query.category);
  }
  if (query.from) {
    params.set("from", query.from);
  }
  if (query.to) {
    params.set("to", query.to);
  }
  if (query.search) {
    params.set("search", query.search);
  }

  return params.toString();
}

function firstSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function isDateOnly(value: string | undefined): value is string {
  return value !== undefined && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function getTransactions(
  query: TransactionListQuery,
): Promise<FetchWrapperResponse<PagedTransactions>> {
  const params = new URLSearchParams();
  params.set("page", String(query.page));
  params.set("pageSize", String(query.pageSize));
  if (query.pocketId != null) {
    params.set("pocketId", String(query.pocketId));
  }
  if (query.category) {
    params.set("category", query.category);
  }
  if (query.from) {
    params.set("from", query.from);
  }
  if (query.to) {
    params.set("to", query.to);
  }
  if (query.search) {
    params.set("search", query.search);
  }

  const transactions = await get<PagedTransactions>(
    `/api/transactions?${params.toString()}`,
  );

  if ("error" in transactions) {
    return transactions;
  }

  if (transactions.data) {
    transactions.data.items = transactions.data.items.map((expense) => ({
      ...expense,
      date: new Date(expense.date),
    }));
  }
  return transactions;
}

export async function createTransaction(expense: Omit<Transaction, "id">) {
  const createTransactionResponse = await post<Transaction>(
    "/api/transactions",
    expense,
  );

  if ("error" in createTransactionResponse) {
    return createTransactionResponse;
  }

  if (createTransactionResponse.data) {
    createTransactionResponse.data.date = new Date(
      createTransactionResponse.data.date,
    );
  }

  return createTransactionResponse;
}

export async function updateTransaction(id: number, expense: Transaction) {
  const updateTransactionResponse = await put<Transaction>(
    `/api/transactions/${id}`,
    expense,
  );

  if ("error" in updateTransactionResponse) {
    return updateTransactionResponse;
  }

  if (updateTransactionResponse.data) {
    updateTransactionResponse.data.date = new Date(
      updateTransactionResponse.data.date,
    );
  }

  return updateTransactionResponse;
}

export async function deleteTransaction(
  id: number,
): Promise<FetchWrapperResponse<void>> {
  const deleteTransactionResponse = await del(`/api/transactions/${id}`);

  if ("error" in deleteTransactionResponse) {
    return {
      error: deleteTransactionResponse.error,
      status: deleteTransactionResponse.status,
    };
  }

  return { status: deleteTransactionResponse.status };
}

export async function deleteTransactions(
  ids: number[],
): Promise<FetchWrapperResponse<void>> {
  const queryParams = new URLSearchParams();
  ids.forEach((id) => queryParams.append("ids", String(id)));

  const deleteTransactionsResponse = await del(
    `/api/transactions?${queryParams.toString()}`,
  );

  if ("error" in deleteTransactionsResponse) {
    return {
      error: deleteTransactionsResponse.error,
      status: deleteTransactionsResponse.status,
    };
  }

  return { status: deleteTransactionsResponse.status };
}
