import { DashboardCard } from "@/app/dashboard/cards/DashboardCard";
import { Activity } from "lucide-react";
import { useIncomeAnalytics } from "@/stores/analytics";
import { Progress } from "@/components/ui/progress";
import {
  ACTIVE_INCOME_CATEGORIES,
  formatMoney,
  PASSIVE_INCOME_CATEGORIES,
} from "../utils";

export function ActivePassiveCard() {
  const { analytics, currency } = useIncomeAnalytics();

  const activePercentage =
    (analytics?.monthlyActiveIncome / analytics?.totalMonthlyIncome) * 100;
  const passivePercentage =
    (analytics?.monthlyPassiveIncome / analytics?.totalMonthlyIncome) * 100;

  return (
    <DashboardCard title="Active vs Passive" icon={Activity}>
      <div className="flex flex-col gap-4 mt-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold">Active</p>
            <p className="rounded-md bg-secondary px-2 py-0.5 text-secondary-foreground">
              {formatMoney(analytics.monthlyActiveIncome, currency)}
            </p>
          </div>
          <Progress value={activePercentage} />
          <p className="text-sm text-muted-foreground">
            {ACTIVE_INCOME_CATEGORIES.map((category) => category).join(", ")}
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold">Passive</p>
            <p className="rounded-md bg-secondary px-2 py-0.5 text-secondary-foreground">
              {formatMoney(analytics.monthlyPassiveIncome, currency)}
            </p>
          </div>
          <Progress value={passivePercentage} />
          <p className="text-sm text-muted-foreground">
            {PASSIVE_INCOME_CATEGORIES.map((category) => category).join(", ")}
          </p>
        </div>
      </div>
    </DashboardCard>
  );
}
