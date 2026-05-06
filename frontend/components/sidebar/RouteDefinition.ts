import { LucideIcon, LayoutDashboard } from "lucide-react";

export interface RouteDefinition {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const routes: RouteDefinition[] = [
  {
    label: "Transactions",
    href: "/transactions",
    icon: LayoutDashboard,
  },
];
