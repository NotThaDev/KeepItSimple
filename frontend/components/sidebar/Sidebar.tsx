"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavigationItems } from "./NavigationItems";
import { NavUser } from "./NavUser";
import { BRANDING } from "./Branding";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { PanelLeftIcon } from "lucide-react";

function AppSidebarHeader() {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarHeader className="p-2">
      <div
        className={cn(
          "group/title relative flex cursor-pointer items-center rounded-md transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
          isCollapsed ? "h-9 justify-center px-0" : "h-9 px-2",
        )}
        onClick={toggleSidebar}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleSidebar();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Toggle sidebar"
      >
        {isCollapsed ? (
          <Image
            src={BRANDING.logo}
            alt={`${BRANDING.name} Logo`}
            className="h-6 w-6 min-h-6 min-w-6 shrink-0"
            width={24}
            height={24}
          />
        ) : (
          <>
            <Image
              src={BRANDING.logo}
              alt={`${BRANDING.name} Logo`}
              className="h-6 w-6 shrink-0"
              width={24}
              height={24}
            />
            <span
              className={cn(
                "ml-2 flex-1 truncate text-lg font-semibold tracking-tight",
              )}
            >
              {BRANDING.name}
            </span>
            <PanelLeftIcon className="ml-2 h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover/title:opacity-100" />
          </>
        )}
      </div>
    </SidebarHeader>
  );
}

export function NavigationMenu() {
  return (
    <>
      <div className="fixed left-3 top-3 z-50 md:hidden">
        <SidebarTrigger />
      </div>
      <Sidebar collapsible="icon">
        <AppSidebarHeader />
        <SidebarContent className="p-2">
          <NavigationItems />
        </SidebarContent>
        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
      </Sidebar>
    </>
  );
}
