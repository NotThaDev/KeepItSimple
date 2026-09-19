"use client";

import { DashboardCard } from "@/app/dashboard/cards/DashboardCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Wallet } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useActiveAnalytics } from "@/stores/analytics";
import { formatMoney } from "../utils";

const ITEMS_PER_PAGE = 3;

export function IncomePocketList() {
  const { analytics } = useActiveAnalytics();
  const sortedPockets = [...analytics.monthlyIncomePerPocket].sort(
    (left, right) => Math.abs(right.total) - Math.abs(left.total),
  );
  const maxTotal = Math.max(
    ...sortedPockets.map((entry) => Math.abs(entry.total)),
    0,
  );
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(sortedPockets.length / ITEMS_PER_PAGE);
  const pagedPockets = useMemo(() => {
    return sortedPockets.slice(
      (page - 1) * ITEMS_PER_PAGE,
      page * ITEMS_PER_PAGE,
    );
  }, [page, sortedPockets]);

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
    <DashboardCard title="Income by pocket" icon={Wallet} className="h-auto">
      {sortedPockets.length === 0 ? (
        <p className="mt-2 flex items-center justify-center text-sm text-muted-foreground">
          No pockets to show for this income view.
        </p>
      ) : (
        <div className="mt-2 flex min-w-0 flex-1 flex-col">
          <div className="flex flex-col gap-4">
            {pagedPockets.map((entry) => {
              const percentage =
                maxTotal === 0 ? 0 : (Math.abs(entry.total) / maxTotal) * 100;

              return (
                <div key={entry.pocket.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{entry.pocket.name}</p>
                    <p className="rounded-md bg-secondary px-2 py-0.5 text-secondary-foreground">
                      {formatMoney(entry.total, entry.pocket.currency)}
                    </p>
                  </div>
                  <Progress value={percentage} />
                </div>
              );
            })}
          </div>
          {sortedPockets.length > ITEMS_PER_PAGE && (
            <div className="flex shrink-0 items-center justify-end gap-2 pt-3">
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
