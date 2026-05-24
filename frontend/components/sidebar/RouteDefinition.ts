import { LucideIcon, ArrowDownUp, Wallet, LayoutDashboard } from "lucide-react";

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
