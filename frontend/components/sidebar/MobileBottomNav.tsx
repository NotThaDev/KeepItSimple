"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  getRouteHref,
  isRouteActive,
  RouteDefinition,
  routes,
  setTitle,
} from "./RouteDefinition";

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="sticky bottom-0 z-40 shrink-0 border-t bg-background/95 backdrop-blur-sm md:hidden pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-4">
        {routes.map((route) => (
          <MobileNavItem key={route.label} route={route} pathname={pathname} />
        ))}
      </ul>
    </nav>
  );
}

interface MobileNavItemProps {
  route: RouteDefinition;
  pathname: string;
}

function MobileNavItem({
  route,
  pathname,
}: Readonly<MobileNavItemProps>) {
  const children = (route.children ?? []).filter((child) => child.href);
  const isActive = isRouteActive(pathname, route);

  if (children.length > 0) {
    return (
      <li>
        <SectionMenu
          route={route}
          pathname={pathname}
          isActive={isActive}
          items={children}
        />
      </li>
    );
  }

  const href = getRouteHref(route);
  if (!href) {
    return null;
  }

  return (
    <li>
      <Link
        href={href}
        onClick={() => setTitle(route.title)}
        aria-current={isActive ? "page" : undefined}
        className={itemClassName(isActive)}
      >
        <ItemIcon icon={route.icon} isActive={isActive} />
        <span className="max-w-full truncate">{route.label}</span>
      </Link>
    </li>
  );
}

interface SectionMenuProps {
  route: RouteDefinition;
  pathname: string;
  isActive: boolean;
  items: RouteDefinition[];
}

function SectionMenu({
  route,
  pathname,
  isActive,
  items,
}: Readonly<SectionMenuProps>) {
  const activeHref = activeChildHref(pathname, items);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-current={isActive ? "page" : undefined}
        className={itemClassName(isActive)}
      >
        <ItemIcon icon={route.icon} isActive={isActive} />
        <span className="max-w-full truncate">{route.label}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="center"
        sideOffset={8}
        className="w-auto min-w-52"
      >
        {items.map((child) => {
          const childActive = child.href === activeHref;

          return (
            <DropdownMenuItem key={child.href} asChild>
              <Link
                href={child.href!}
                onClick={() => setTitle(child.title)}
                aria-current={childActive ? "page" : undefined}
                className={cn(
                  "min-h-10 gap-2 px-2",
                  childActive && "bg-muted text-foreground",
                )}
              >
                <child.icon aria-hidden />
                {child.label}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface ItemIconProps {
  icon: RouteDefinition["icon"];
  isActive: boolean;
}

function ItemIcon({ icon: Icon, isActive }: Readonly<ItemIconProps>) {
  return (
    <span
      className={cn(
        "flex size-8 items-center justify-center rounded-full",
        isActive && "bg-muted",
      )}
    >
      <Icon className="size-5" aria-hidden />
    </span>
  );
}

function itemClassName(isActive: boolean) {
  return cn(
    "flex min-h-14 w-full touch-manipulation flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium outline-none",
    isActive
      ? "text-foreground"
      : "text-muted-foreground hover:text-foreground",
  );
}

function activeChildHref(pathname: string, children: RouteDefinition[]) {
  return children
    .filter(
      (child) =>
        child.href &&
        (pathname === child.href || pathname.startsWith(`${child.href}/`)),
    )
    .sort((a, b) => (b.href?.length ?? 0) - (a.href?.length ?? 0))[0]?.href;
}
