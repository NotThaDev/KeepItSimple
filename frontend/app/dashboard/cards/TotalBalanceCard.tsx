"use client";

import { getCurrencySymbolFromCode } from "@/lib/helpers/currencyHelper";
import { Analytics } from "@/lib/models/Analytics";
import {
  ArrowDownRight,
  ArrowUpRight,
  Badge,
  ChevronLeft,
  ChevronRight,
  Wallet,
} from "lucide-react";
import { DashboardCard } from "./DashboardCard";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

interface TotalBalanceCardProps {
  analytics: Analytics;
}

const ITEMS_PER_PAGE = 4;

export function TotalBalanceCard({
  analytics,
}: Readonly<TotalBalanceCardProps>) {
  const sortedPockets = [...analytics.expensesPerPocket].sort(
    (left, right) => right.pocket.balance - left.pocket.balance,
  );

  const [page, setPage] = useState(1);

  const pagedPockets = useMemo(() => {
    return sortedPockets.slice(
      (page - 1) * ITEMS_PER_PAGE,
      page * ITEMS_PER_PAGE,
    );
  }, [sortedPockets, page]);

  const totalPages = Math.ceil(sortedPockets.length / ITEMS_PER_PAGE);

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

  const isPositiveBalance =
    analytics.currentMonthTotalBalance > analytics.previousMonthTotalBalance;

  return (
    <DashboardCard title="Total balance" icon={Wallet}>
      <div className="flex h-full min-h-0 flex-col gap-0">
        <div className="flex flex-col gap-1">
          <p className="text-3xl font-semibold">
            {getCurrencySymbolFromCode(
              analytics.expensesPerPocket[0]?.pocket.currency ?? "USD",
            )}{" "}
            {analytics.currentMonthTotalBalance.toFixed(2)}
          </p>

          <div className="flex items-center gap-1">
            <p
              className={`text-md ${isPositiveBalance ? "text-green-500" : "text-red-500"}`}
            >
              {getCurrencySymbolFromCode(
                analytics.expensesPerPocket[0]?.pocket.currency ?? "USD",
              )}
              {Math.abs(analytics.previousMonthTotalBalance).toFixed(2)}{" "}
            </p>

            {isPositiveBalance ? (
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            )}

            <p className="text-xs text-muted-foreground">from last month</p>
          </div>
        </div>

        <div className="mt-[20px] flex min-h-0 flex-1 flex-col gap-1">
          <p className="text-sm text-muted-foreground mb-1">
            Balances by pocket
          </p>
          <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
            {pagedPockets.map((pocket) => {
              const percentage =
                analytics.currentMonthTotalBalance === 0
                  ? 0
                  : (pocket.pocket.balance /
                      analytics.currentMonthTotalBalance) *
                    100;

              return (
                <div
                  key={pocket.pocket.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <Badge className="rounded-md p-1 mr-1" />
                    <p className="font-semibold">{pocket.pocket.name}</p>
                    <p className="ml-2 text-xs font-normal text-muted-foreground">
                      - {percentage.toFixed(0)}%
                    </p>
                  </div>
                  <p className="rounded-md bg-secondary px-2 py-0.5 text-secondary-foreground">
                    {getCurrencySymbolFromCode(pocket.pocket.currency)}
                    {pocket.pocket.balance.toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>

          {sortedPockets.length > ITEMS_PER_PAGE && (
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
    </DashboardCard>
  );
}
