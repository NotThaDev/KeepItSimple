"use client";

import { usePathname } from "next/navigation";
import { BRANDING } from "./Branding";
import { NavUser } from "./NavUser";
import { getRouteForPath } from "./RouteDefinition";

export function MobileHeader() {
  const pathname = usePathname();
  const title = getRouteForPath(pathname)?.title ?? BRANDING.name;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 px-4 pt-[env(safe-area-inset-top)] md:hidden">
      <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
      <NavUser compact />
    </header>
  );
}
