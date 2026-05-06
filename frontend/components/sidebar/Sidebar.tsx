import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavigationItems } from "./NavigationItems";
import { NavUser } from "./NavUser";
import { BRANDING } from "./Branding";
import Image from "next/image";

export function NavigationMenu() {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center ms-1 mt-2">
          <Image
            src={BRANDING.logo}
            alt={`${BRANDING.name} Logo`}
            className="h-6 w-6"
            width={24}
            height={24}
          />
          <span className="px-2 text-lg font-semibold tracking-tight">
            {BRANDING.name}
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <NavigationItems />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
