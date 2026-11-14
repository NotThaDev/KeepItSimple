"use client";

import { Badge } from "@/components/ui/badge";
import { createCategoryColors } from "@/lib/helpers/colors";
import { useCategories } from "@/stores/categories";

export function CategoryBadge({
  categoryId,
}: Readonly<{ categoryId: number }>) {
  const category = useCategories().byId(categoryId);
  const colors = createCategoryColors(category.color);

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
      {category.name}
    </Badge>
  );
}
