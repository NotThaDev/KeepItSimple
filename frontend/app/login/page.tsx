import Image from "next/image";
import { BRANDING } from "@/components/sidebar/Branding";
import { MoneyBackground } from "./MoneyBackground";
import { LoginPageContent } from "./LoginPageContent";
import { ShowcasePanel } from "./ShowcasePanel";

export default function LoginPage() {
  return (
    <div className="grid min-h-svh bg-background p-3 lg:grid-cols-2 lg:gap-3">
      <div className="relative isolate flex flex-col overflow-hidden px-4 py-6 sm:px-10 short:py-4">
        <MoneyBackground />
        <div className="relative flex items-center gap-2">
          <Image src={BRANDING.logo} alt="" width={32} height={32} />
          <span className="text-xl font-semibold">{BRANDING.name}</span>
        </div>
        <main className="relative flex flex-1 items-center justify-center py-10 short:py-2">
          <LoginPageContent />
        </main>
        <footer className="relative text-sm text-muted-foreground">
          © {new Date().getFullYear()} {BRANDING.name}
        </footer>
      </div>
      <ShowcasePanel />
    </div>
  );
}
