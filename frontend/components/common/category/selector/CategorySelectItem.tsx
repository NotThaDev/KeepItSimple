import { SelectItem } from "@/components/ui/select";
import { createCategoryColors } from "@/lib/helpers/colors";
import type { Category } from "@/lib/models/Category";

export function CategorySelectItem({
  category,
  itemValue,
}: {
  category: Category;
  itemValue: string;
}) {
  const colors = createCategoryColors(category.color);

  return (
    <SelectItem
      value={itemValue}
      className="min-w-0 *:min-w-0 *:[span]:last:overflow-hidden"
    >
      <span
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: colors.background }}
        aria-hidden
      />
      <span className="min-w-0 truncate">{category.name}</span>
    </SelectItem>
  );
}
