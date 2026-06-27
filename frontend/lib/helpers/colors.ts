import { TransactionCategory } from "../models/Transaction";

export interface CategoryColors {
  background: string;
  foreground: string;
}

function hexToRgba(hexColor: string, alpha: number): string {
  const hex = hexColor.replace("#", "");
  const red = parseInt(hex.substring(0, 2), 16);
  const green = parseInt(hex.substring(2, 4), 16);
  const blue = parseInt(hex.substring(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function createCategoryColors(background: string): CategoryColors {
  return {
    background,
    foreground: hexToRgba(background, 0.18),
  };
}

export const DEFAULT_CATEGORY_COLORS: CategoryColors = {
  background: "#9E9E9E",
  foreground: hexToRgba("#9E9E9E", 0.18),
};

export const CategoryColorMap: Record<TransactionCategory, CategoryColors> = {
  [TransactionCategory.Coffe]: createCategoryColors("#8B5E3C"),
  [TransactionCategory.Food]: createCategoryColors("#4CAF50"),
  [TransactionCategory.Transport]: createCategoryColors("#2196F3"),
  [TransactionCategory.Entertainment]: createCategoryColors("#0D9488"),
  [TransactionCategory.Utilities]: createCategoryColors("#FF9800"),
  [TransactionCategory.Shopping]: createCategoryColors("#BE185D"),
  [TransactionCategory.Health]: createCategoryColors("#EF4444"),
  [TransactionCategory.Education]: createCategoryColors("#1E3A8A"),
  [TransactionCategory.Travel]: createCategoryColors("#0EA5E9"),
  [TransactionCategory.Sports]: createCategoryColors("#06B6D4"),
  [TransactionCategory.Subscriptions]: createCategoryColors("#A16207"),
  [TransactionCategory.Savings]: createCategoryColors("#14B8A6"),
  [TransactionCategory.Investments]: createCategoryColors("#10B981"),
  [TransactionCategory.Gifts]: createCategoryColors("#EC4899"),
  [TransactionCategory.Love]: createCategoryColors("#F43F5E"),
  [TransactionCategory.Charity]: createCategoryColors("#22C55E"),
  [TransactionCategory.Other]: createCategoryColors("#9E9E9E"),
  [TransactionCategory.Salary]: createCategoryColors("#15803D"),
  [TransactionCategory.Bonus]: createCategoryColors("#65A30D"),
  [TransactionCategory.Freelance]: createCategoryColors("#0F766E"),
  [TransactionCategory.Business]: createCategoryColors("#1D4ED8"),
  [TransactionCategory.Interest]: createCategoryColors("#3F6212"),
  [TransactionCategory.Dividends]: createCategoryColors("#0891B2"),
  [TransactionCategory.RentalIncome]: createCategoryColors("#475569"),
  [TransactionCategory.Refund]: createCategoryColors("#BE123C"),
};
