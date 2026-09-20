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
  [TransactionCategory.Refund]: createCategoryColors("#38BDF8"),
  [TransactionCategory.Car]: createCategoryColors("#F59E0B"),
  [TransactionCategory.Clothing]: createCategoryColors("#7C3AED"),
  [TransactionCategory.Accessories]: createCategoryColors("#C026D3"),
  [TransactionCategory.Furniture]: createCategoryColors("#B45309"),
  [TransactionCategory.Home]: createCategoryColors("#92400E"),
  [TransactionCategory.Newsstand]: createCategoryColors("#64748B"),
  [TransactionCategory.Events]: createCategoryColors("#DB2777"),
  [TransactionCategory.Computers]: createCategoryColors("#4338CA"),
  [TransactionCategory.Hotel]: createCategoryColors("#0E7490"),
  [TransactionCategory.School]: createCategoryColors("#1D4ED8"),
  [TransactionCategory.Books]: createCategoryColors("#9A3412"),
  [TransactionCategory.Motorcycle]: createCategoryColors("#1F2937"),
  [TransactionCategory.Music]: createCategoryColors("#7E22CE"),
  [TransactionCategory.Gym]: createCategoryColors("#047857"),
  [TransactionCategory.Hairdresser]: createCategoryColors("#E11D48"),
  [TransactionCategory.Personal]: createCategoryColors("#A21CAF"),
  [TransactionCategory.Repairs]: createCategoryColors("#EA580C"),
  [TransactionCategory.Relationships]: createCategoryColors("#BE185D"),
  [TransactionCategory.Services]: createCategoryColors("#0369A1"),
  [TransactionCategory.Special]: createCategoryColors("#CA8A04"),
  [TransactionCategory.Groceries]: createCategoryColors("#16A34A"),
  [TransactionCategory.Sport]: createCategoryColors("#0D9488"),
  [TransactionCategory.Leisure]: createCategoryColors("#2563EB"),
  [TransactionCategory.Taxes]: createCategoryColors("#991B1B"),
  [TransactionCategory.Phone]: createCategoryColors("#4F46E5"),
  [TransactionCategory.Film]: createCategoryColors("#C02688"),
  [TransactionCategory.Insurance]: createCategoryColors("#334155"),
  [TransactionCategory.Lease]: createCategoryColors("#7C2D12"),
  [TransactionCategory.Rent]: createCategoryColors("#9A3412"),
  [TransactionCategory.Mortgage]: createCategoryColors("#44403C"),
  [TransactionCategory.Loan]: createCategoryColors("#8B5CF6"),
  [TransactionCategory.Transfer]: createCategoryColors("#6366F1"),
  [TransactionCategory.Withdraw]: createCategoryColors("#0F766E"),
};
