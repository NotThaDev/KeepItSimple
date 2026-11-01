"use client";

import { Bell, CircleUserRound, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface AccountTab {
  label: string;
  href: string;
  icon: LucideIcon;
}

const TABS: AccountTab[] = [
  { label: "Profile", href: "/account", icon: CircleUserRound },
  { label: "Notifications", href: "/account/notifications", icon: Bell },
];

export function AccountTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Account sections" className="inline-flex w-fit items-center gap-1 rounded-lg bg-muted p-1">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
              active && "bg-background text-foreground shadow-sm",
            )}
          >
            <Icon className="size-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
