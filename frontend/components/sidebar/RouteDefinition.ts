import { LucideIcon, LayoutDashboard } from "lucide-react";

export interface RouteDefinition {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const routes: RouteDefinition[] = [
  {
    label: "Tracker",
    href: "/tracker",
    icon: LayoutDashboard,
  },
];
