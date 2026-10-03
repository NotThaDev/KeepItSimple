import "./globals.css";
import { NavigationMenu } from "@/components/sidebar/Sidebar";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "next-themes";
import { CSSProperties } from "react";
import { Toaster } from "@/components/ui/sonner";
import type { Viewport } from "next";

export const dynamic = "force-dynamic";
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={cn("font-sans", geist.variable)}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider
            defaultOpen={true}
            style={
              {
                "--sidebar-width": "220px",
              } as CSSProperties
            }
          >
            <NavigationMenu>
              <Toaster position="top-center" />
              <main className="min-h-0 w-full flex-1 overflow-y-auto">
                {children}
              </main>
            </NavigationMenu>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
