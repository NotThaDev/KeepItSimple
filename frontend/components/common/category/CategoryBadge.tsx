"use client";

import { Badge } from "@/components/ui/badge";
import { createCategoryColors } from "@/lib/helpers/colors";
import { Category } from "@/lib/models/Category";
import { useCategories } from "@/stores/categories";
import { createElement } from "react";
import { getCategoryIcon } from "./iconRegistry";

interface CategoryBadgeProps {
  categoryId?: number;
  // Explicit values (e.g. a live preview); wins over categoryId.
  preview?: Pick<Category, "name" | "icon" | "color">;
  // Off by default so existing tables keep their text-only badges.
  showIcon?: boolean;
}

export function CategoryBadge({
  categoryId,
  preview,
  showIcon = false,
}: Readonly<CategoryBadgeProps>) {
  const stored = useCategories().byId(categoryId);
  const category = preview ?? stored;
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
      {showIcon && createElement(getCategoryIcon(category.icon))}
      {category.name}
    </Badge>
  );
}
