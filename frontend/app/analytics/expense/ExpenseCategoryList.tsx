"use client";

import { DashboardCard } from "@/app/dashboard/cards/DashboardCard";
import { Button } from "@/components/ui/button";
import {
  CategoryColorMap,
  DEFAULT_CATEGORY_COLORS,
} from "@/lib/helpers/colors";
import { formatCategoryLabel } from "@/lib/models/Transaction";
import {
  ChevronLeft,
  ChevronRight,
  PieChart as PieChartIcon,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useExpenseAnalytics } from "@/stores/analytics";
import { formatMoney, formatPercent } from "../utils";

const ITEMS_PER_PAGE = 4;

export function ExpenseCategoryList() {
  const { analytics, currency } = useExpenseAnalytics();
  const sortedCategories = [...analytics.expenseByCategory]
    .map((entry) => ({
      ...entry,
      total: Math.abs(entry.total),
    }))
    .filter((entry) => entry.total > 0)
    .sort((left, right) => right.total - left.total);
  const total = sortedCategories.reduce((sum, entry) => sum + entry.total, 0);
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(sortedCategories.length / ITEMS_PER_PAGE);
  const pagedCategories = useMemo(() => {
    return sortedCategories.slice(
      (page - 1) * ITEMS_PER_PAGE,
      page * ITEMS_PER_PAGE,
    );
  }, [page, sortedCategories]);

  const handleNextPage = useCallback(() => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  }, [page, totalPages]);

  const handlePreviousPage = useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page]);

  return (
    <DashboardCard
      title="Expenses by category"
      icon={PieChartIcon}
      className="h-auto min-h-[20rem]"
    >
      {sortedCategories.length === 0 ? (
        <p className="mt-2 flex h-full min-h-[240px] items-center justify-center text-sm text-muted-foreground">
          No expenses recorded this month to show by category.
        </p>
      ) : (
        <div className="mt-2 flex min-h-[240px] min-w-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
            {pagedCategories.map((entry) => {
              const share = total === 0 ? 0 : entry.total / total;
              const color =
                CategoryColorMap[entry.category]?.background ??
                DEFAULT_CATEGORY_COLORS.background;

              return (
                <div key={entry.category} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-semibold">
                      {formatCategoryLabel(entry.category)}
                    </p>
                    <div className="flex shrink-0 items-center gap-2">
                      <p className="text-sm text-muted-foreground">
                        {formatPercent(share)}
                      </p>
                      <p className="rounded-md bg-secondary px-2 py-0.5 text-secondary-foreground">
                        {formatMoney(entry.total, currency)}
                      </p>
                    </div>
                  </div>
                  <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${share * 100}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {sortedCategories.length > ITEMS_PER_PAGE && (
            <div className="mt-auto flex shrink-0 items-center justify-end gap-2 pt-3">
              <Button
                variant="outline"
                size="icon"
                disabled={page === 1 || totalPages <= 1}
                aria-label="Previous Page"
                onClick={handlePreviousPage}
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Next Page"
                disabled={page === totalPages || totalPages <= 1}
                onClick={handleNextPage}
              >
                <ChevronRight />
              </Button>
            </div>
          )}
        </div>
      )}
    </DashboardCard>
  );
}
