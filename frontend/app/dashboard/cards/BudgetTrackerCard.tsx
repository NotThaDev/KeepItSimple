import { Analytics } from "@/lib/models/Analytics";
import { SquircleDashed, ReceiptText } from "lucide-react";
import { DashboardCard } from "./DashboardCard";
import { getCurrencySymbolFromCode } from "@/lib/helpers/currencyHelper";
import { ExpensesPieChart } from "./ExpensesPieChart";
import {
  CategoryColorMap,
  DEFAULT_CATEGORY_COLORS,
} from "@/lib/helpers/colors";

interface BudgetTrackerCardProps {
  analytics: Analytics;
}

export function BudgetTrackerCard({
  analytics,
}: Readonly<BudgetTrackerCardProps>) {
  const sortedCategories = [...analytics.monthlyExpensesByCategory].sort(
    (left, right) => Math.abs(right.total) - Math.abs(left.total),
  );

  return (
    <DashboardCard title="Monthly Expenses" icon={ReceiptText}>
      <div className="flex w-full items-start justify-start gap-4">
        <ExpensesPieChart analytics={analytics} />
        {sortedCategories.length > 0 ? (
          <div className="flex flex-col flex-1 gap-1 mt-[24px]">
            <p className="text-sm text-muted-foreground mb-3">
              Expenses by category
            </p>
            {sortedCategories.map((entry) => (
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
                    analytics.expensesPerPocket[0]?.pocket.currency ?? "USD",
                  )}
                  {Math.abs(entry.total).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No transactions recorded for the current month.
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
