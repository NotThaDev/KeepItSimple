import { LucideIcon, ArrowDownUp, Wallet, LayoutDashboard } from "lucide-react";

export interface RouteDefinition {
  label: string;
  title: string;
  href: string;
  icon: LucideIcon;
}

export const routes: RouteDefinition[] = [
  {
    label: "Dashboard",
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Transactions",
    title: "Transactions",
    href: "/transactions",
    icon: ArrowDownUp,
  },
  {
    label: "Pockets",
    title: "Pockets",
    href: "/pockets",
    icon: Wallet,
  },
];

export function getRouteForPath(pathname: string) {
  return routes.find(
    (route) => pathname === route.href || pathname.startsWith(`${route.href}/`),
  );
}

export function setTitle(title: string) {
  if (document.title !== title) {
    document.title = title;
  }
}
