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
  INCOME_TRANSACTION_CATEGORIES,
  TransactionCategory,
} from "@/lib/models/Transaction";
import { useMemo } from "react";

interface TransactionImportCategorySelectProps {
  value: TransactionCategory;
  amount: number;
  onChange: (category: TransactionCategory) => void;
}

function categoriesForAmount(amount: number) {
  return amount > 0
    ? INCOME_TRANSACTION_CATEGORIES
    : EXPENSE_TRANSACTION_CATEGORIES;
}

export function TransactionImportCategorySelect({
  value,
  amount,
  onChange,
}: Readonly<TransactionImportCategorySelectProps>) {
  const colors = CategoryColorMap[value] ?? DEFAULT_CATEGORY_COLORS;
  const categoryItems = useMemo(() => {
    const items = categoriesForAmount(amount);
    if (items.includes(value)) {
      return items;
    }

    return [value, ...items];
  }, [amount, value]);

  return (
    <Select
      value={value}
      onValueChange={(nextValue) => onChange(nextValue as TransactionCategory)}
    >
      <SelectTrigger
        className="w-full min-w-44 border dark:bg-transparent dark:hover:bg-transparent [&_svg]:text-current"
        style={{
          backgroundColor: colors.foreground,
          color: colors.background,
          borderColor: colors.background,
        }}
      >
        <SelectValue />
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
                {item}
              </SelectItem>
            );
          })}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
