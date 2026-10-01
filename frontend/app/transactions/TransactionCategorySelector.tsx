"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CategoryColorMap,
  DEFAULT_CATEGORY_COLORS,
} from "@/lib/helpers/colors";
import {
  ALL_TRANSACTION_CATEGORIES,
  EXPENSE_TRANSACTION_CATEGORIES,
  formatCategoryLabel,
  INCOME_TRANSACTION_CATEGORIES,
  TransactionCategory,
} from "@/lib/models/Transaction";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

type TransactionCategorySelectorProps = {
  value?: TransactionCategory;
  onChange: (category: TransactionCategory) => void;
  isInvalid?: boolean;
  placeholder?: string;
  className?: string;
} & (
  | { showAll?: false; isIncome: boolean }
  | { showAll: true; isIncome?: boolean }
);

function categoriesForType(isIncome: boolean) {
  return isIncome
    ? INCOME_TRANSACTION_CATEGORIES
    : EXPENSE_TRANSACTION_CATEGORIES;
}

export function TransactionCategorySelector({
  value,
  isIncome = false,
  showAll = false,
  onChange,
  isInvalid,
  placeholder,
  className,
}: Readonly<TransactionCategorySelectorProps>) {
  const colors = value
    ? (CategoryColorMap[value] ?? DEFAULT_CATEGORY_COLORS)
    : undefined;
  const categoryItems = useMemo(() => {
    const items = showAll
      ? ALL_TRANSACTION_CATEGORIES
      : categoriesForType(isIncome);
    if (value && !items.includes(value)) {
      return [value, ...items];
    }

    return items;
  }, [isIncome, showAll, value]);

  return (
    <Select
      value={value}
      onValueChange={(nextValue) => onChange(nextValue as TransactionCategory)}
    >
      <SelectTrigger
        aria-invalid={isInvalid}
        className={cn(
          "w-full min-w-44 border dark:bg-transparent dark:hover:bg-transparent [&_svg]:text-current",
          className,
        )}
        style={
          colors
            ? {
                backgroundColor: colors.foreground,
                color: colors.background,
                borderColor: colors.background,
              }
            : undefined
        }
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {categoryItems.map((item) => {
            const itemColors =
              CategoryColorMap[item] ?? DEFAULT_CATEGORY_COLORS;

            return (
              <SelectItem
                key={item}
                value={item}
                style={{ color: itemColors.background }}
              >
                {formatCategoryLabel(item)}
              </SelectItem>
            );
          })}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
