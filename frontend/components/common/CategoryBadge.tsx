import { Badge } from "@/components/ui/badge";
import {
  CategoryColorMap,
  DEFAULT_CATEGORY_COLORS,
} from "@/lib/helpers/colors";
import { TransactionCategory } from "@/lib/models/Transaction";

export function CategoryBadge({
  category,
}: Readonly<{ category: TransactionCategory }>) {
  const colors = CategoryColorMap[category] ?? DEFAULT_CATEGORY_COLORS;

  return (
    <Badge
      className="capitalize"
      variant="secondary"
      style={{
        backgroundColor: colors.foreground,
        color: colors.background,
        borderColor: colors.background,
      }}
    >
      {category}
    </Badge>
  );
}
