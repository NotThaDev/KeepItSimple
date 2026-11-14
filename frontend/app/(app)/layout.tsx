import { NavigationMenu } from "@/components/sidebar/NavigationMenu";
import { NotificationsDrawer } from "@/components/notifications/NotificationsDrawer";
import { SidebarProvider } from "@/components/ui/sidebar";
import { CSSProperties } from "react";
import { getCurrentUser } from "@/lib/dal";
import { getCategories } from "@/lib/models/Category";
import { CategoriesProvider } from "@/stores/categories";
import { NotificationsProvider } from "@/stores/notifications";
import { UserIdentityProvider } from "@/stores/userIdentity";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, categories] = await Promise.all([
    getCurrentUser(),
    getCategories(),
  ]);
  return (
    <UserIdentityProvider user={user}>
      <CategoriesProvider categories={categories.data ?? []}>
      <NotificationsProvider>
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
          <NotificationsDrawer />
        </SidebarProvider>
      </NotificationsProvider>
      </CategoriesProvider>
    </UserIdentityProvider>
  );
}
