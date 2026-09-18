import {
  LucideIcon,
  ArrowDownUp,
  Wallet,
  LayoutDashboard,
  ChartColumn,
} from "lucide-react";

export interface RouteDefinition {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const routes: RouteDefinition[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: ChartColumn,
  },
  {
    label: "Transactions",
    href: "/transactions",
    icon: ArrowDownUp,
  },
  {
    label: "Pockets",
    href: "/pockets",
    icon: Wallet,
  },
];
