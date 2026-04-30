import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavigationItems } from "./NavigationItems";
import { NavUser } from "./NavUser";

export function NavigationMenu() {
  return (
    <Sidebar>
      <SidebarHeader>
        <span className="px-2 text-lg font-semibold tracking-tight">
          KeepItSimple
        </span>
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
