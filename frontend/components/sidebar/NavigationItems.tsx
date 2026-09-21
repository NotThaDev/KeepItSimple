"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getRouteForPath,
  RouteDefinition,
  routes,
  setTitle,
} from "./RouteDefinition";

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
        <NavItem
          key={route.href ?? route.label}
          route={route}
          pathname={pathname}
        />
      ))}
    </SidebarMenu>
  );
}

function isPathActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavItem({
  route,
  pathname,
}: {
  route: RouteDefinition;
  pathname: string;
}) {
  const children = route.children ?? [];
  const childActive = children.some(
    (child) => child.href && isPathActive(pathname, child.href),
  );
  const [open, setOpen] = useState(childActive);

  if (children.length === 0) {
    if (!route.href) {
      return null;
    }

    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname === route.href}>
          <Link href={route.href} onClick={() => setTitle(route.title)}>
            <route.icon />
            <span>{route.label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible
      asChild
      open={open}
      onOpenChange={setOpen}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton>
            <route.icon />
            <span>{route.label}</span>
            <ChevronRight
              className="ml-auto transition-transform duration-200"
              style={{ transform: open ? "rotate(90deg)" : undefined }}
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {children.map((child) =>
              child.href ? (
                <SidebarMenuSubItem key={child.href}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={pathname === child.href}
                  >
                    <Link
                      href={child.href}
                      onClick={() => setTitle(child.title)}
                    >
                      <child.icon />
                      <span>{child.label}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ) : null,
            )}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}
