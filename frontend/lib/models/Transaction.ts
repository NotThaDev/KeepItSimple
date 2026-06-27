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

export async function getTransactions(): Promise<
  FetchWrapperResponse<Transaction[]>
> {
  const transactions = await get<Transaction[]>("/api/transactions");

  if ("error" in transactions) {
    return transactions;
  }

  transactions.data = transactions.data?.map((expense) => ({
    ...expense,
    date: new Date(expense.date),
  }));
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
