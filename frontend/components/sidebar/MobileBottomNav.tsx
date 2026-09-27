"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { routes, setTitle } from "./RouteDefinition";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="sticky bottom-0 z-40 shrink-0 border-t bg-background/95 backdrop-blur-sm md:hidden pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-4">
        {routes.map((route) => {
          const isActive =
            pathname === route.href || pathname.startsWith(`${route.href}/`);

          return (
            <li key={route.href}>
              <Link
                href={route.href}
                onClick={() => setTitle(route.title)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-14 touch-manipulation flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full",
                    isActive && "bg-muted",
                  )}
                >
                  <route.icon className="size-5" aria-hidden />
                </span>
                <span className="max-w-full truncate">{route.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
