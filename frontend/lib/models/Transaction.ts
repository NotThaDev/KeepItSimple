import { endOfMonth, format, startOfMonth } from "date-fns";
import { del, FetchWrapperResponse, get, post, put } from "../fetchWrapper";

export interface Transaction {
  id: number;
  description?: string;
  amount: number;
  date: Date;
  categoryId: number;
  pocketId: number;
}

export const DEFAULT_TRANSACTION_PAGE_SIZE = 10;
export interface TransactionListQuery {
  page: number;
  pageSize: number;
  pocketId?: number;
  categoryId?: number;
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
  const categoryIdValue = Number(firstSearchParam(searchParams.categoryId));
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
    categoryId:
      Number.isInteger(categoryIdValue) && categoryIdValue > 0
        ? categoryIdValue
        : undefined,
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
  if (query.categoryId != null) {
    params.set("categoryId", String(query.categoryId));
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
  if (query.categoryId != null) {
    params.set("categoryId", String(query.categoryId));
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

export async function createTransfer(request: {
  fromPocketId: number;
  toPocketId: number;
  amount: number;
  date: Date;
  description?: string;
}): Promise<
  FetchWrapperResponse<{ outgoing: Transaction; incoming: Transaction }>
> {
  const response = await post<{ outgoing: Transaction; incoming: Transaction }>(
    "/api/transactions/transfer",
    request,
  );

  if ("error" in response) {
    return response;
  }

  if (response.data) {
    response.data.outgoing.date = new Date(response.data.outgoing.date);
    response.data.incoming.date = new Date(response.data.incoming.date);
  }

  return response;
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

export enum MappableField {
  Ignore = "Ignore",
  Description = "Description",
  Amount = "Amount",
  Date = "Date",
  Category = "Category",
}

const ALL_MAPPABLE_FIELDS = Object.values(MappableField);

export function isMappableField(value: string): value is MappableField {
  return ALL_MAPPABLE_FIELDS.includes(value as MappableField);
}

export interface TransactionImportColumn {
  index: number;
  name: string;
}

export interface TransactionImportAnalyzeResponse {
  sessionId: string;
  columns: TransactionImportColumn[];
  sampleRows: Record<string, string>[];
}

export interface TransactionImportColumnMapping {
  columnIndex: number;
  targetField: MappableField;
}

export interface TransactionImportDraft {
  description?: string;
  amount: number;
  date: string;
  categoryId: number;
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
  defaultCategoryId?: number;
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
