import { SelectItem } from "@/components/ui/select";
import {
  CategoryColorMap,
  DEFAULT_CATEGORY_COLORS,
} from "@/lib/helpers/colors";
import {
  formatCategoryLabel,
  TransactionCategory,
} from "@/lib/models/Transaction";

export function CategorySelectItem({
  category,
  itemValue,
}: {
  category: TransactionCategory;
  itemValue: string;
}) {
  const colors = CategoryColorMap[category] ?? DEFAULT_CATEGORY_COLORS;

  return (
    <SelectItem value={itemValue}>
      <span
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: colors.background }}
        aria-hidden
      />
      {formatCategoryLabel(category)}
    </SelectItem>
  );
}
