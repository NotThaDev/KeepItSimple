import { Analytics } from "@/lib/models/Analytics";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface BalanceProps {
  icon: React.ReactNode;
  color: string;
}

export function getBalanceProps(analytics: Analytics): BalanceProps | null {
  if (
    analytics.currentMonthTotalBalance === analytics.previousMonthTotalBalance
  ) {
    return null;
  }

  if (
    analytics.currentMonthTotalBalance > analytics.previousMonthTotalBalance
  ) {
    return {
      icon: <ArrowUpRight className="h-4 w-4 text-green-500" />,
      color: "text-green-500",
    };
  }

  return {
    icon: <ArrowDownRight className="h-4 w-4 text-red-500" />,
    color: "text-red-500",
  };
}
