"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { routes } from "./RouteDefinition";

export function NavigationItems() {
  const pathname = usePathname();

  return (
    <SidebarMenu className="w-full gap-1">
      {routes.map((route) => (
        <SidebarMenuItem key={route.href}>
          <SidebarMenuButton asChild isActive={pathname === route.href}>
            <Link href={route.href}>
              <route.icon />
              <span>{route.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
