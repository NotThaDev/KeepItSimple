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
  Car = "Car",
  Clothing = "Clothing",
  Accessories = "Accessories",
  Furniture = "Furniture",
  Home = "Home",
  Newsstand = "Newsstand",
  Events = "Events",
  Computers = "Computers",
  Hotel = "Hotel",
  School = "School",
  Books = "Books",
  Motorcycle = "Motorcycle",
  Music = "Music",
  Gym = "Gym",
  Hairdresser = "Hairdresser",
  Personal = "Personal",
  Repairs = "Repairs",
  Relationships = "Relationships",
  Services = "Services",
  Special = "Special",
  Groceries = "Groceries",
  Sport = "Sport",
  Leisure = "Leisure",
  Taxes = "Taxes",
  Phone = "Phone",
  Film = "Film",
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
  TransactionCategory.Car,
  TransactionCategory.Clothing,
  TransactionCategory.Accessories,
  TransactionCategory.Furniture,
  TransactionCategory.Home,
  TransactionCategory.Newsstand,
  TransactionCategory.Events,
  TransactionCategory.Computers,
  TransactionCategory.Hotel,
  TransactionCategory.School,
  TransactionCategory.Books,
  TransactionCategory.Motorcycle,
  TransactionCategory.Music,
  TransactionCategory.Gym,
  TransactionCategory.Hairdresser,
  TransactionCategory.Personal,
  TransactionCategory.Repairs,
  TransactionCategory.Relationships,
  TransactionCategory.Services,
  TransactionCategory.Special,
  TransactionCategory.Groceries,
  TransactionCategory.Sport,
  TransactionCategory.Leisure,
  TransactionCategory.Taxes,
  TransactionCategory.Phone,
  TransactionCategory.Film,
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
  TransactionCategory.Savings,
  TransactionCategory.Investments,
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

export interface TransactionImportColumn {
  index: number;
  name: string;
}

export interface TransactionImportAnalyzeResponse {
  sessionId: string;
  columns: TransactionImportColumn[];
  sampleRows: Record<string, string>[];
  mappableFields: string[];
}

export interface TransactionImportColumnMapping {
  columnIndex: number;
  targetField: string;
}

export interface TransactionImportDraft {
  description?: string;
  amount: number;
  date: string;
  category: TransactionCategory;
  pocketId: number;
}

export interface TransactionImportPreviewResponse {
  sessionId: string;
  transactions: TransactionImportDraft[];
  errors: string[];
}

export interface TransactionImportConfirmResponse {
  savedCount: number;
  transactions: TransactionImportDraft[];
}

export async function analyzeTransactionImport(
  file: File,
): Promise<FetchWrapperResponse<TransactionImportAnalyzeResponse>> {
  const formData = new FormData();
  formData.append("file", file);
  return post<TransactionImportAnalyzeResponse>(
    "/api/transactions/import/analyze",
    formData,
  );
}

export async function previewTransactionImport(request: {
  sessionId: string;
  pocketId: number;
  mapping: TransactionImportColumnMapping[];
  defaultCategory?: TransactionCategory;
}): Promise<FetchWrapperResponse<TransactionImportPreviewResponse>> {
  return post<TransactionImportPreviewResponse>(
    "/api/transactions/import/preview",
    request,
  );
}

export async function confirmTransactionImport(request: {
  sessionId: string;
  pocketId: number;
  transactions: TransactionImportDraft[];
}): Promise<FetchWrapperResponse<TransactionImportConfirmResponse>> {
  return post<TransactionImportConfirmResponse>(
    "/api/transactions/import/confirm",
    request,
  );
}
