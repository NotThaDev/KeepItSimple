import {
  ALL_TRANSACTION_CATEGORIES,
  EXPENSE_TRANSACTION_CATEGORIES,
  formatCategoryLabel,
  INCOME_TRANSACTION_CATEGORIES,
  TransactionCategory,
} from "./Transaction";

export interface CategoryGroup {
  id: string;
  label: string;
  categories: TransactionCategory[];
}

export const EXPENSE_CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: "food-drink",
    label: "Food & Drink",
    categories: [
      TransactionCategory.Coffe,
      TransactionCategory.Food,
      TransactionCategory.Groceries,
    ],
  },
  {
    id: "transport",
    label: "Transport",
    categories: [
      TransactionCategory.Transport,
      TransactionCategory.Car,
      TransactionCategory.Motorcycle,
    ],
  },
  {
    id: "home",
    label: "Home",
    categories: [
      TransactionCategory.Home,
      TransactionCategory.Furniture,
      TransactionCategory.Utilities,
      TransactionCategory.Repairs,
      TransactionCategory.Rent,
      TransactionCategory.Mortgage,
      TransactionCategory.Lease,
    ],
  },
  {
    id: "shopping",
    label: "Shopping",
    categories: [
      TransactionCategory.Shopping,
      TransactionCategory.Clothing,
      TransactionCategory.Accessories,
      TransactionCategory.Computers,
    ],
  },
  {
    id: "health",
    label: "Health",
    categories: [
      TransactionCategory.Health,
      TransactionCategory.Personal,
      TransactionCategory.Hairdresser,
      TransactionCategory.Gym,
      TransactionCategory.Sports,
      TransactionCategory.Sport,
    ],
  },
  {
    id: "leisure",
    label: "Leisure",
    categories: [
      TransactionCategory.Entertainment,
      TransactionCategory.Leisure,
      TransactionCategory.Events,
      TransactionCategory.Music,
      TransactionCategory.Film,
      TransactionCategory.Travel,
      TransactionCategory.Hotel,
      TransactionCategory.Newsstand,
    ],
  },
  {
    id: "education",
    label: "Education",
    categories: [
      TransactionCategory.Education,
      TransactionCategory.School,
      TransactionCategory.Books,
    ],
  },
  {
    id: "bills",
    label: "Bills",
    categories: [
      TransactionCategory.Subscriptions,
      TransactionCategory.Phone,
      TransactionCategory.Services,
      TransactionCategory.Insurance,
      TransactionCategory.Taxes,
    ],
  },
  {
    id: "money",
    label: "Money",
    categories: [
      TransactionCategory.Savings,
      TransactionCategory.Investments,
      TransactionCategory.Loan,
      TransactionCategory.Transfer,
      TransactionCategory.Withdraw,
    ],
  },
  {
    id: "giving",
    label: "Giving",
    categories: [
      TransactionCategory.Gifts,
      TransactionCategory.Love,
      TransactionCategory.Charity,
      TransactionCategory.Relationships,
    ],
  },
  {
    id: "other",
    label: "Other",
    categories: [TransactionCategory.Other, TransactionCategory.Special],
  },
];

export const INCOME_CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: "work",
    label: "Work",
    categories: [
      TransactionCategory.Salary,
      TransactionCategory.Bonus,
      TransactionCategory.Freelance,
      TransactionCategory.Business,
    ],
  },
  {
    id: "investments",
    label: "Investments",
    categories: [
      TransactionCategory.Interest,
      TransactionCategory.Dividends,
      TransactionCategory.Investments,
      TransactionCategory.Savings,
    ],
  },
  {
    id: "property",
    label: "Property",
    categories: [TransactionCategory.RentalIncome],
  },
  {
    id: "other",
    label: "Other",
    categories: [TransactionCategory.Refund, TransactionCategory.Transfer],
  },
];

assertGroupsCover(EXPENSE_CATEGORY_GROUPS, EXPENSE_TRANSACTION_CATEGORIES);
assertGroupsCover(INCOME_CATEGORY_GROUPS, INCOME_TRANSACTION_CATEGORIES);

function getSource(isIncome: boolean, showAll?: boolean) {
  if (showAll) {
    return combineCategoryGroups([
      ...EXPENSE_CATEGORY_GROUPS,
      ...INCOME_CATEGORY_GROUPS,
    ]);
  }

  return isIncome ? INCOME_CATEGORY_GROUPS : EXPENSE_CATEGORY_GROUPS;
}

function combineCategoryGroups(groups: CategoryGroup[]): CategoryGroup[] {
  const combined: CategoryGroup[] = [];
  const seenCategories = new Set<TransactionCategory>();

  for (const group of groups) {
    const categories = group.categories.filter((category) => {
      if (seenCategories.has(category)) {
        return false;
      }

      seenCategories.add(category);
      return true;
    });
    if (categories.length === 0) {
      continue;
    }

    const existing = combined.find((item) => item.id === group.id);
    if (existing) {
      existing.categories.push(...categories);
      continue;
    }

    combined.push({
      id: group.id,
      label: group.label,
      categories,
    });
  }

  const otherIndex = combined.findIndex((group) => group.id === "other");
  if (otherIndex >= 0) {
    const [other] = combined.splice(otherIndex, 1);
    combined.push(other);
  }

  return combined;
}

function getAllowedCategories(isIncome: boolean, showAll?: boolean) {
  if (showAll) {
    return ALL_TRANSACTION_CATEGORIES;
  }

  return isIncome
    ? INCOME_TRANSACTION_CATEGORIES
    : EXPENSE_TRANSACTION_CATEGORIES;
}

export function groupsForTransactionType(
  isIncome: boolean,
  showAll?: boolean,
  extraCategory?: TransactionCategory,
): CategoryGroup[] {
  const source = getSource(isIncome, showAll);
  const allowed = getAllowedCategories(isIncome, showAll);
  const groups = source.map((group) => ({
    ...group,
    categories: [...group.categories],
  }));

  if (extraCategory && !allowed.includes(extraCategory)) {
    const otherGroup = groups.find((group) => group.id === "other");
    if (otherGroup) {
      if (!otherGroup.categories.includes(extraCategory)) {
        otherGroup.categories.unshift(extraCategory);
      }
    } else {
      groups.push({
        id: "other",
        label: "Other",
        categories: [extraCategory],
      });
    }
  }

  return groups;
}

export function findCategoryGroupId(
  groups: CategoryGroup[],
  category: TransactionCategory | undefined,
): string | undefined {
  if (category === undefined) {
    return groups[0]?.id;
  }

  return (
    groups.find((group) => group.categories.includes(category))?.id ??
    groups[0]?.id
  );
}

export function filterCategoryGroups(
  groups: CategoryGroup[],
  query: string,
): CategoryGroup[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return groups;
  }

  return groups
    .map((group) => {
      if (group.label.toLowerCase().includes(normalized)) {
        return group;
      }

      return {
        ...group,
        categories: group.categories.filter((category) =>
          categoryMatchesQuery(category, normalized),
        ),
      };
    })
    .filter((group) => group.categories.length > 0);
}

function categoryMatchesQuery(
  category: TransactionCategory,
  normalizedQuery: string,
): boolean {
  return (
    category.toLowerCase().includes(normalizedQuery) ||
    formatCategoryLabel(category).toLowerCase().includes(normalizedQuery)
  );
}

function assertGroupsCover(
  groups: CategoryGroup[],
  allCategories: TransactionCategory[],
): void {
  const seen = new Set<TransactionCategory>();
  const duplicates: TransactionCategory[] = [];

  for (const group of groups) {
    for (const category of group.categories) {
      if (seen.has(category)) {
        duplicates.push(category);
      }
      seen.add(category);
    }
  }

  const missing = allCategories.filter((category) => !seen.has(category));
  if (missing.length > 0 || duplicates.length > 0) {
    const details = [
      missing.length > 0 ? `missing ${missing.join(", ")}` : undefined,
      duplicates.length > 0 ? `duplicated ${duplicates.join(", ")}` : undefined,
    ]
      .filter(Boolean)
      .join("; ");
    throw new Error(`Invalid category groups: ${details}`);
  }
}
