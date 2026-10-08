import {
  isTransactionCategory,
  TransactionCategory,
} from "@/lib/models/Transaction";
import {
  LucideIcon,
  Utensils,
  Car,
  Home,
  ShoppingBag,
  HeartPulse,
  Ticket,
  GraduationCap,
  Receipt,
  Wallet,
  Gift,
  MoreHorizontal,
  Briefcase,
  TrendingUp,
  Building2,
} from "lucide-react";

export interface CategoryGroups {
  expenses: CategoryGroup[];
  incomes: CategoryGroup[];
}

export interface CategoryGroup {
  id: string;
  label: string;
  categories: TransactionCategory[];
}

const OTHER_CATEGORIES = {
  expenses: [TransactionCategory.Other, TransactionCategory.Special],
  incomes: [TransactionCategory.Refund, TransactionCategory.Transfer],
};

const EXPENSE_CATEGORY_GROUPS: CategoryGroup[] = [
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
];

const INCOME_CATEGORY_GROUPS: CategoryGroup[] = [
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
];

export const CATEGORY_GROUPS = {
  expenses: EXPENSE_CATEGORY_GROUPS.concat({
    id: "other",
    label: "Other",
    categories: OTHER_CATEGORIES.expenses,
  }),
  incomes: INCOME_CATEGORY_GROUPS.concat({
    id: "other",
    label: "Other",
    categories: OTHER_CATEGORIES.incomes,
  }),
  all: [...EXPENSE_CATEGORY_GROUPS, ...INCOME_CATEGORY_GROUPS].concat({
    id: "other",
    label: "Other",
    categories: [...OTHER_CATEGORIES.expenses, ...OTHER_CATEGORIES.incomes],
  }),
};

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
          category.toLowerCase().includes(normalized),
        ),
      };
    })
    .filter((group) => group.categories.length > 0);
}

export const GROUP_ICONS: Record<string, LucideIcon> = {
  "food-drink": Utensils,
  transport: Car,
  home: Home,
  shopping: ShoppingBag,
  health: HeartPulse,
  leisure: Ticket,
  education: GraduationCap,
  bills: Receipt,
  money: Wallet,
  giving: Gift,
  other: MoreHorizontal,
  work: Briefcase,
  investments: TrendingUp,
  property: Building2,
};

export function selectItemValue(
  groupId: string,
  category: TransactionCategory,
) {
  return `${groupId}::${category}`;
}

export function categoryFromItemValue(value: string) {
  const category = value.split("::").at(-1);
  return isTransactionCategory(category) ? category : undefined;
}

export function groupsForSelector(isIncome: boolean, showAll: boolean) {
  if (showAll) {
    return CATEGORY_GROUPS.all;
  }

  return isIncome ? CATEGORY_GROUPS.incomes : CATEGORY_GROUPS.expenses;
}

export function groupIdForCategory(
  groups: CategoryGroup[],
  category: TransactionCategory,
) {
  return (
    groups.find((group) => group.categories.includes(category))?.id ??
    groups[0]?.id ??
    "other"
  );
}
