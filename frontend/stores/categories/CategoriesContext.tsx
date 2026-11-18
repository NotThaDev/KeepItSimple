"use client";

import { createContext, useContext, useMemo } from "react";
import type { Category } from "@/lib/models/Category";
import type {
  CategoriesContext as CategoriesContextValue,
  CategoriesProviderProps,
  CategoryGroup,
  CategoryTab,
} from "./types";

const CategoriesContext = createContext<CategoriesContextValue | null>(null);

const CUSTOM_GROUP = "Custom";

const PLACEHOLDER_OTHER: Category = {
  id: 0,
  key: "Other",
  name: "Other",
  kind: "Expense",
  group: "Other",
  icon: "MoreHorizontal",
  color: "#9E9E9E",
};

// Expense tab: Expense, Saving, Transfer. Income tab: Income, Saving, Transfer.
const TAB_KINDS: Record<CategoryTab, Category["kind"][]> = {
  expense: ["Expense", "Saving", "Transfer"],
  income: ["Income", "Saving", "Transfer"],
  all: ["Expense", "Income", "Saving", "Transfer"],
};

const isCustom = (category: Category) => category.key === null;

// Groups appear in order of first appearance by id (seed order); custom ones go last.
function buildGroups(categories: Category[]): CategoryGroup[] {
  const groups = new Map<string, CategoryGroup>();
  const sorted = [...categories].sort(
    (a, b) => Number(isCustom(a)) - Number(isCustom(b)) || a.id - b.id,
  );

  for (const category of sorted) {
    const label = isCustom(category) ? CUSTOM_GROUP : category.group;
    const group = groups.get(label) ?? {
      id: label,
      label,
      icon: isCustom(category) ? "Tag" : category.icon,
      categories: [],
    };
    group.categories.push(category);
    groups.set(label, group);
  }

  return [...groups.values()];
}

// The list comes from the server layout (GET /api/categories), so the browser makes no extra call.
export function CategoriesProvider({
  categories,
  children,
}: Readonly<CategoriesProviderProps>) {
  const value = useMemo<CategoriesContextValue>(() => {
    const sorted = [...categories].sort((a, b) => a.id - b.id);
    const byIdMap = new Map(sorted.map((c) => [c.id, c]));
    const byKeyMap = new Map(
      sorted.filter((c) => c.key).map((c) => [c.key!.toLowerCase(), c]),
    );
    const other = byKeyMap.get("other") ?? PLACEHOLDER_OTHER;
    const inTab = (tab: CategoryTab) =>
      sorted.filter((c) => TAB_KINDS[tab].includes(c.kind));

    return {
      categories: sorted,
      other,
      expenseCategories: inTab("expense"),
      incomeCategories: inTab("income"),
      byId: (id) => (id == null ? undefined : byIdMap.get(id)) ?? other,
      byKey: (key) => byKeyMap.get(key.toLowerCase()),
      groups: (tab) => buildGroups(inTab(tab)),
    };
  }, [categories]);

  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  const context = useContext(CategoriesContext);
  if (!context) {
    throw new Error("useCategories must be used within CategoriesProvider");
  }
  return context;
}
