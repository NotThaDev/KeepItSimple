import { DashboardCard } from "@/app/(app)/dashboard/cards/DashboardCard";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { formatAmount } from "@/lib/helpers/currencyHelper";
import { cn } from "@/lib/utils";
import { useSavingAnalytics } from "@/stores/analytics";
import { Wallet } from "lucide-react";

const BAR_COLORS = {
  income:
    "[&_[data-slot=progress-indicator]]:bg-[#16a34a] dark:[&_[data-slot=progress-indicator]]:bg-[#22c55e]",
  expenses:
    "[&_[data-slot=progress-indicator]]:bg-[#dc2626] dark:[&_[data-slot=progress-indicator]]:bg-[#ef4444]",
  leftover:
    "[&_[data-slot=progress-indicator]]:bg-[#2563eb] dark:[&_[data-slot=progress-indicator]]:bg-[#60a5fa]",
  savings:
    "[&_[data-slot=progress-indicator]]:bg-[#0f766e] dark:[&_[data-slot=progress-indicator]]:bg-[#14b8a6]",
  untagged:
    "[&_[data-slot=progress-indicator]]:bg-[#d97706] dark:[&_[data-slot=progress-indicator]]:bg-[#f59e0b]",
};

function BreakdownRow({
  label,
  amount,
  value,
  color,
}: Readonly<{
  label: string;
  amount: string;
  value: number;
  color: keyof typeof BAR_COLORS;
}>) {
  return (
    <>
      <p className="font-semibold">{label}</p>
      <Progress
        value={value}
        className={cn("h-2.5 min-w-0", BAR_COLORS[color])}
      />
      <p className="justify-self-end rounded-md bg-secondary px-2 py-0.5 text-right tabular-nums text-secondary-foreground">
        {amount}
      </p>
    </>
  );
}

export function LeftoverBreakDown() {
  const { analytics, currency } = useSavingAnalytics();
  const income = analytics.monthlyIncome;
  const toPercentage = (value: number) =>
    income > 0 ? Math.min(100, Math.max(0, (value / income) * 100)) : 0;

  const expensesPercentage = toPercentage(analytics.monthlyExpenses);
  const leftoverPercentage = toPercentage(analytics.leftOver);
  const savingsPercentage = toPercentage(analytics.totalMonthlySavings);

  const moneyLeft = analytics.leftOver - analytics.totalMonthlySavings;
  const moneyLeftPercentage = toPercentage(moneyLeft);

  return (
    <DashboardCard title="Leftover Break Down" icon={Wallet}>
      <div className="mt-2 grid grid-cols-[auto_1fr_auto] items-center gap-x-5 gap-y-3 h-[180px]">
        <BreakdownRow
          label="Income"
          amount={formatAmount(analytics.monthlyIncome, currency)}
          value={income > 0 ? 100 : 0}
          color="income"
        />
        <BreakdownRow
          label="Expenses"
          amount={formatAmount(analytics.monthlyExpenses, currency)}
          value={expensesPercentage}
          color="expenses"
        />

        <Separator className="col-span-3 my-3" />

        <BreakdownRow
          label="Leftover"
          amount={formatAmount(analytics.leftOver, currency)}
          value={leftoverPercentage}
          color="leftover"
        />
        <BreakdownRow
          label="Saved"
          amount={formatAmount(analytics.totalMonthlySavings, currency)}
          value={savingsPercentage}
          color="savings"
        />
        <BreakdownRow
          label="Untagged"
          amount={formatAmount(moneyLeft, currency)}
          value={moneyLeftPercentage}
          color="untagged"
        />
      </div>
    </DashboardCard>
  );
}
