"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { BRANDING } from "./Branding";
import { routes } from "./RouteDefinition";

function titleForPath(pathname: string) {
  const route = routes.find((item) => item.href === pathname);
  return route ? `${route.label} | ${BRANDING.name}` : BRANDING.name;
}

export function NavigationItems() {
  const pathname = usePathname();

  useEffect(() => {
    document.title = titleForPath(pathname);
  }, [pathname]);

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
