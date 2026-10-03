import {
  ArrowDownUp,
  ChartNoAxesCombined,
  LayoutDashboard,
  List,
  ListFilter,
  LucideIcon,
  Wallet,
} from "lucide-react";

export interface RouteDefinition {
  label: string;
  title: string;
  href?: string;
  icon: LucideIcon;
  children?: RouteDefinition[];
}

export const routes: RouteDefinition[] = [
  {
    label: "Dashboard",
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Analytics",
    title: "Analytics",
    href: "/analytics",
    icon: ChartNoAxesCombined,
  },
  {
    label: "Transactions",
    title: "Transactions",
    icon: ArrowDownUp,
    children: [
      {
        label: "Transaction List",
        title: "Transactions",
        href: "/transactions",
        icon: List,
      },
      {
        label: "Category Rules",
        title: "Category Rules",
        href: "/transactions/rules",
        icon: ListFilter,
      },
    ],
  },
  {
    label: "Pockets",
    title: "Pockets",
    href: "/pockets",
    icon: Wallet,
  },
];

function flattenRoutes(items: RouteDefinition[]): RouteDefinition[] {
  return items.flatMap((route) =>
    route.children?.length ? flattenRoutes(route.children) : [route],
  );
}

export function getRouteForPath(pathname: string) {
  const all = flattenRoutes(routes).filter((route) => route.href);
  const exact = all.find((route) => pathname === route.href);
  if (exact) {
    return exact;
  }

  return all
    .filter((route) => pathname.startsWith(`${route.href}/`))
    .sort((a, b) => (b.href?.length ?? 0) - (a.href?.length ?? 0))[0];
}

export function setTitle(title: string) {
  if (document.title !== title) {
    document.title = title;
  }
}
