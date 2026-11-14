import type { ReactNode } from "react";
import type { Category } from "@/lib/models/Category";

export type CategoryTab = "expense" | "income" | "all";

export interface CategoryGroup {
  id: string;
  label: string;
  // Lucide icon name for the group header.
  icon: string;
  categories: Category[];
}

export interface CategoriesContextState {
  categories: Category[];
  // Fallback for unknown ids; a placeholder when the list failed to load.
  other: Category;
  expenseCategories: Category[];
  incomeCategories: Category[];
}

export interface CategoriesContextAction {
  byId: (id: number | null | undefined) => Category;
  // Maps a legacy enum name (rule condition values) to its category.
  byKey: (key: string) => Category | undefined;
  groups: (tab: CategoryTab) => CategoryGroup[];
}

export type CategoriesContext = CategoriesContextState &
  CategoriesContextAction;

export interface CategoriesProviderProps {
  categories: Category[];
  children: ReactNode;
}
