"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { getRouteForPath, routes, setTitle } from "./RouteDefinition";

export function NavigationItems() {
  const pathname = usePathname();

  useEffect(() => {
    const route = getRouteForPath(pathname);
    if (!route) {
      return;
    }

    const applyTitle = () => setTitle(route.title);
    applyTitle();

    const observer = new MutationObserver(applyTitle);
    observer.observe(document.head, {
      childList: true,
      characterData: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [pathname]);

  return (
    <SidebarMenu className="w-full gap-1">
      {routes.map((route) => (
        <SidebarMenuItem key={route.href}>
          <SidebarMenuButton asChild isActive={pathname === route.href}>
            <Link href={route.href} onClick={() => setTitle(route.title)}>
              <route.icon />
              <span>{route.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
