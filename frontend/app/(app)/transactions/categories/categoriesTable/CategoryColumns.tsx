"use client";

import { CategoryBadge } from "@/components/common/category/CategoryBadge";
import { type DataTableFeatures } from "@/components/common/dataTable/DataTableFeatures";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Lock } from "lucide-react";
import { Category } from "@/lib/models/Category";
import { createColumnHelper } from "@tanstack/react-table";
import { CategoryActionsMenu } from "./CategoryActionsMenu";

interface CategoryColumnsProps {
  onChanged: () => void;
}

const columnHelper = createColumnHelper<DataTableFeatures, Category>();

export function getCategoryColumns({
  onChanged,
}: Readonly<CategoryColumnsProps>) {
  return columnHelper.columns([
    columnHelper.display({
      id: "name",
      header: "Category",
      cell: ({ row }) => (
        <CategoryBadge showIcon categoryId={row.original.id} />
      ),
    }),
    columnHelper.accessor("kind", {
      header: "Type",
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{getValue()}</span>
      ),
    }),
    columnHelper.display({
      id: "group",
      header: "Group",
      meta: { className: "hidden sm:table-cell" },
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.key === null ? "Custom" : row.original.group}
        </span>
      ),
    }),
    columnHelper.display({
      id: "actions",
      size: 1,
      header: () => <div className="text-center">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          {row.original.key === null ? (
            <CategoryActionsMenu
              category={row.original}
              onChanged={onChanged}
            />
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-muted-foreground">
                    <Lock className="size-3" />
                    Default
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  Default categories can&apos;t be changed
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      ),
    }),
  ]);
}
