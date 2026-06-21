import { TransactionCategory } from "../models/Transaction";

export const CategoryColorMap: Record<TransactionCategory, string> = {
  [TransactionCategory.Coffe]: "#8B5E3C",
  [TransactionCategory.Food]: "#4CAF50",
  [TransactionCategory.Transport]: "#2196F3",
  [TransactionCategory.Entertainment]: "#9C27B0",
  [TransactionCategory.Utilities]: "#FF9800",
  [TransactionCategory.Other]: "#9E9E9E",
};
