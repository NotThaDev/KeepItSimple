import { del, FetchWrapperResponse, get, post, put } from "../fetchWrapper";

export interface Transaction {
  id: number;
  description?: string;
  amount: number;
  date: Date;
  category: TransactionCategory;
}

export enum TransactionCategory {
  Food = "Food",
  Transport = "Transport",
  Entertainment = "Entertainment",
  Utilities = "Utilities",
  Other = "Other",
  Coffe = "Coffe",
}

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
