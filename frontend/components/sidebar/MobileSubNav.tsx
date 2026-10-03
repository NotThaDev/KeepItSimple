"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSectionForPath, setTitle } from "./RouteDefinition";
import { cn } from "@/lib/utils";

export function MobileSubNav() {
  const pathname = usePathname();
  const children =
    getSectionForPath(pathname)?.children?.filter((child) => child.href) ?? [];

  if (children.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Section"
      className="px-4 pb-2 md:hidden"
    >
      <ul className="flex gap-2 overflow-x-auto">
        {children.map((child) => {
          const isActive = pathname === child.href;

          return (
            <li key={child.href}>
              <Link
                href={child.href!}
                onClick={() => setTitle(child.title)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap",
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <child.icon className="size-3.5" aria-hidden />
                {child.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
