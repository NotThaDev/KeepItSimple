"use client";

import { Button } from "@/components/ui/button";
import {
  CategoryColorMap,
  DEFAULT_CATEGORY_COLORS,
} from "@/lib/helpers/colors";
import { formatAmount } from "@/lib/helpers/currencyHelper";
import { ExpenseByCategory } from "@/lib/models/Analytics";
import { formatCategoryLabel } from "@/lib/models/Transaction";
import { cn } from "@/lib/utils";
import {
  BanknoteX,
  ChevronLeft,
  ChevronRight,
  ReceiptText,
  SquircleDashed,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { DashboardCard } from "../../../app/dashboard/cards/DashboardCard";
import { TransactionPieChart } from "./TransactionPieChart";

interface TransactionTrackerCardProps {
  categories: ExpenseByCategory[];
  currency: string;
  title?: string;
  listTitle?: string;
  centerLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  icon?: LucideIcon;
  className?: string;
}

const ITEMS_PER_PAGE = 5;

export function TransactionTrackerCard({
  categories,
  currency,
  title = "Monthly Expenses",
  listTitle = "Expenses by category",
  centerLabel = "Expenses",
  emptyTitle = "No expenses yet",
  emptyDescription = "Transactions recorded this month will appear here once you start tracking your expenses.",
  icon: Icon = ReceiptText,
  className,
}: Readonly<TransactionTrackerCardProps>) {
  const sortedCategories = [...categories].sort(
    (left, right) => Math.abs(right.total) - Math.abs(left.total),
  );

  const [page, setPage] = useState(1);

  const pagedCategories = useMemo(() => {
    return sortedCategories.slice(
      (page - 1) * ITEMS_PER_PAGE,
      page * ITEMS_PER_PAGE,
    );
  }, [sortedCategories, page]);

  const totalPages = Math.ceil(sortedCategories.length / ITEMS_PER_PAGE);

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
      title={title}
      icon={Icon}
      className={cn("min-h-[20rem] flex-1 xl:min-h-0", className)}
    >
      <div className="flex h-full min-h-0 w-full gap-4">
        {sortedCategories.length > 0 ? (
          <>
            <TransactionPieChart
              categories={sortedCategories}
              currency={currency}
              label={centerLabel}
            />
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <p className="mb-3 shrink-0 text-sm text-muted-foreground">
                {listTitle}
              </p>
              <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
                {pagedCategories.map((entry) => (
                  <div
                    key={entry.category}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <SquircleDashed
                        className="mr-2"
                        size={18}
                        color={
                          CategoryColorMap[entry.category]?.background ??
                          DEFAULT_CATEGORY_COLORS.background
                        }
                      />
                      <p className="font-semibold">
                        {formatCategoryLabel(entry.category)}
                      </p>
                    </div>
                    <p className="rounded-md bg-secondary px-2 py-0.5 text-secondary-foreground">
                      {formatAmount(Math.abs(entry.total), currency)}
                    </p>
                  </div>
                ))}
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
          </>
        ) : (
          <div className="flex h-full w-full flex-1 items-center justify-center">
            <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-dashed bg-muted/30 px-6 py-8 text-center shadow-sm">
              <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/15">
                <BanknoteX className="size-6" />
              </div>
              <div className="space-y-1.5">
                <p className="text-base font-semibold">{emptyTitle}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {emptyDescription}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
