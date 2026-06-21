import { getCurrencySymbolFromCode } from "@/lib/helpers/currencyHelper";
import { Analytics } from "@/lib/models/Analytics";
import { Badge, Wallet } from "lucide-react";
import { DashboardCard } from "./DashboardCard";

interface TotalBalanceCardProps {
  analytics: Analytics;
}

export function TotalBalanceCard({
  analytics,
}: Readonly<TotalBalanceCardProps>) {
  const sortedPockets = [...analytics.expensesPerPocket].sort(
    (left, right) => right.pocket.balance - left.pocket.balance,
  );
  return (
    <DashboardCard title="Total balance" icon={Wallet}>
      <div className="space-y-4">
        <p className="text-3xl font-semibold">
          {getCurrencySymbolFromCode(
            analytics.expensesPerPocket[0]?.pocket.currency ?? "USD",
          )}{" "}
          {analytics.currentMonthTotalBalance.toFixed(2)}
        </p>

        <div className="flex flex-col gap-1 mt-[26px]">
          <p className="text-sm text-muted-foreground mb-3">
            Balances by pocket
          </p>
          <div className="flex flex-col gap-1">
            {sortedPockets.map((pocket) => {
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
        </div>
      </div>
    </DashboardCard>
  );
}
