import { NavigationMenu } from "@/components/sidebar/NavigationMenu";
import { SidebarProvider } from "@/components/ui/sidebar";
import { CSSProperties } from "react";
import { getCurrentUser } from "@/lib/dal";
import { UserIdentityProvider } from "@/stores/userIdentity";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  return (
    <UserIdentityProvider user={user}>
      <SidebarProvider
        defaultOpen={true}
        style={
          {
            "--sidebar-width": "220px",
          } as CSSProperties
        }
      >
        <NavigationMenu>
          <main className="min-h-0 w-full flex-1 overflow-y-auto">
            {children}
          </main>
        </NavigationMenu>
      </SidebarProvider>
    </UserIdentityProvider>
  );
}
