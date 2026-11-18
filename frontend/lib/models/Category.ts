import { del, FetchWrapperResponse, get, post, put } from "../fetchWrapper";

export type CategoryKind = "Expense" | "Income" | "Saving" | "Transfer";

export interface Category {
  id: number;
  // Enum name of a system category; null for the user's custom ones.
  key: string | null;
  name: string;
  kind: CategoryKind;
  group: string;
  // Lucide component name, resolved with getCategoryIcon.
  icon: string;
  // Hex color, e.g. "#8B5E3C".
  color: string;
}

export type CategoryInput = Pick<Category, "name" | "kind" | "icon" | "color">;

export interface CategoryUsage {
  transactions: number;
  rules: number;
}

export async function getCategories(): Promise<
  FetchWrapperResponse<Category[]>
> {
  return await get<Category[]>("/api/categories");
}

export async function createCategory(
  category: CategoryInput,
): Promise<FetchWrapperResponse<Category>> {
  return await post<Category>("/api/categories", category);
}

export async function updateCategory(
  id: number,
  category: CategoryInput,
): Promise<FetchWrapperResponse<Category>> {
  return await put<Category>(`/api/categories/${id}`, category);
}

export async function deleteCategory(
  id: number,
): Promise<FetchWrapperResponse<void>> {
  return await del(`/api/categories/${id}`);
}

export async function getCategoryUsage(
  id: number,
): Promise<FetchWrapperResponse<CategoryUsage>> {
  return await get<CategoryUsage>(`/api/categories/${id}/usage`);
}
