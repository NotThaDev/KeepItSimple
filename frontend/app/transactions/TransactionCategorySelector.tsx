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
  EXPENSE_TRANSACTION_CATEGORIES,
  formatCategoryLabel,
  INCOME_TRANSACTION_CATEGORIES,
  TransactionCategory,
} from "@/lib/models/Transaction";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface TransactionCategorySelectorProps {
  value: TransactionCategory;
  isIncome: boolean;
  onChange: (category: TransactionCategory) => void;
  isInvalid?: boolean;
  placeholder?: string;
  className?: string;
}

function categoriesForType(isIncome: boolean) {
  return isIncome
    ? INCOME_TRANSACTION_CATEGORIES
    : EXPENSE_TRANSACTION_CATEGORIES;
}

export function TransactionCategorySelector({
  value,
  isIncome,
  onChange,
  isInvalid,
  placeholder,
  className,
}: Readonly<TransactionCategorySelectorProps>) {
  const colors = CategoryColorMap[value] ?? DEFAULT_CATEGORY_COLORS;
  const categoryItems = useMemo(() => {
    const items = categoriesForType(isIncome);
    if (items.includes(value)) {
      return items;
    }

    return [value, ...items];
  }, [isIncome, value]);

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
        style={{
          backgroundColor: colors.foreground,
          color: colors.background,
          borderColor: colors.background,
        }}
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
