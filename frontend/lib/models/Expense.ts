import { create } from "domain";
import { FetchWrapperResponse, get, post, put } from "../fetchWrapper";

export interface Expense {
  id: number;
  description?: string;
  amount: number;
  date: Date;
  category: ExpenseCategory;
}

export enum ExpenseCategory {
  Food = "Food",
  Transport = "Transport",
  Entertainment = "Entertainment",
  Utilities = "Utilities",
  Other = "Other",
  Coffe = "Coffe",
}

export async function getExpenses(): Promise<FetchWrapperResponse<Expense[]>> {
  const expenses = await get<Expense[]>("/api/expenses");

  if ("error" in expenses) {
    return expenses;
  }

  expenses.data = expenses.data?.map((expense) => ({
    ...expense,
    date: new Date(expense.date),
  }));
  return expenses;
}

export async function createExpense(expense: Omit<Expense, "id">) {
  const createExpenseResponse = await post<Expense>("/api/expenses", expense);

  if ("error" in createExpenseResponse) {
    return createExpenseResponse;
  }

  if (createExpenseResponse.data) {
    createExpenseResponse.data.date = new Date(createExpenseResponse.data.date);
  }

  return createExpenseResponse;
}

export async function updateExpense(id: number, expense: Expense) {
  const updateExpenseResponse = await put<Expense>(
    `/api/expenses/${id}`,
    expense,
  );

  if ("error" in updateExpenseResponse) {
    return updateExpenseResponse;
  }

  if (updateExpenseResponse.data) {
    updateExpenseResponse.data.date = new Date(updateExpenseResponse.data.date);
  }

  return updateExpenseResponse;
}
