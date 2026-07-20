"use client";

import { Button } from "@/components/ui/button";
import {
  CategoryColorMap,
  DEFAULT_CATEGORY_COLORS,
} from "@/lib/helpers/colors";
import { getCurrencySymbolFromCode } from "@/lib/helpers/currencyHelper";
import { Analytics } from "@/lib/models/Analytics";
import {
  ChevronLeft,
  ChevronRight,
  ReceiptText,
  SquircleDashed,
  BanknoteX,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { DashboardCard } from "./DashboardCard";
import { ExpensesPieChart } from "./ExpensesPieChart";

interface BudgetTrackerCardProps {
  analytics: Analytics;
}

const ITEMS_PER_PAGE = 5;

export function BudgetTrackerCard({
  analytics,
}: Readonly<BudgetTrackerCardProps>) {
  const sortedCategories = [...analytics.monthlyExpensesByCategory].sort(
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
    <DashboardCard title="Monthly Expenses" icon={ReceiptText}>
      <div className="flex h-full min-h-0 w-full items-start justify-start gap-4">
        {sortedCategories.length > 0 ? (
          <div>
            <ExpensesPieChart analytics={analytics} />
            <div className="flex min-h-0 flex-1 self-stretch flex-col gap-1 pt-[24px]">
              <p className="text-sm text-muted-foreground mb-3">
                Expenses by category
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
                      <p className="font-semibold">{entry.category}</p>
                    </div>
                    <p className="rounded-md bg-secondary px-2 py-0.5 text-secondary-foreground">
                      {getCurrencySymbolFromCode(
                        analytics.expensesPerPocket[0]?.pocket.currency ??
                          "USD",
                      )}
                      {Math.abs(entry.total).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              {sortedCategories.length > ITEMS_PER_PAGE && (
                <div className="mt-auto flex items-center justify-end gap-2 pt-3">
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
          </div>
        ) : (
          <div className="flex h-full w-full flex-1 items-center justify-center">
            <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-dashed bg-muted/30 px-6 py-8 text-center shadow-sm">
              <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/15">
                <BanknoteX className="size-6" />
              </div>
              <div className="space-y-1.5">
                <p className="text-base font-semibold">No expenses yet</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Transactions recorded this month will appear here once you
                  start tracking your expenses.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
