import { FetchWrapperResponse, get } from "../fetchWrapper";

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
