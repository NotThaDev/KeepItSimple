"use client";

import { DashboardCard } from "@/app/dashboard/cards/DashboardCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatAmount } from "@/lib/helpers/currencyHelper";
import { TransactionPerPocket } from "@/lib/models/Analytics";
import { ChevronLeft, ChevronRight, Wallet } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

const ITEMS_PER_PAGE = 3;

interface PocketListProps {
  title: string;
  pockets: TransactionPerPocket[];
  emptyMessage: string;
}

export function PocketList({
  title,
  pockets,
  emptyMessage,
}: Readonly<PocketListProps>) {
  const sortedPockets = [...pockets].sort(
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
    <DashboardCard title={title} icon={Wallet}>
      {sortedPockets.length === 0 ? (
        <p className="mt-2 flex items-center justify-center text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        <div className="mt-2 flex min-h-0 min-w-0 flex-1 flex-col min-h-[180px]">
          <div className="flex flex-1 flex-col gap-4">
            {pagedPockets.map((entry) => {
              const percentage =
                maxTotal === 0 ? 0 : (Math.abs(entry.total) / maxTotal) * 100;

              return (
                <div key={entry.pocket.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{entry.pocket.name}</p>
                    <p className="rounded-md bg-secondary px-2 py-0.5 text-secondary-foreground">
                      {formatAmount(entry.total, entry.pocket.currency)}
                    </p>
                  </div>
                  <Progress value={percentage} />
                </div>
              );
            })}
          </div>
          {sortedPockets.length > ITEMS_PER_PAGE && (
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
