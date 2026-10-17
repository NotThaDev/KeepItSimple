import Image from "next/image";
import { BRANDING } from "@/components/sidebar/Branding";
import { LoginPageContent } from "./LoginPageContent";
import { ShowcasePanel } from "./ShowcasePanel";

export default function LoginPage() {
  return (
    <div className="grid min-h-svh bg-background p-3 lg:grid-cols-2 lg:gap-3">
      <div className="flex flex-col px-4 py-6 sm:px-10">
        <div className="flex items-center gap-2">
          <Image src={BRANDING.logo} alt="" width={32} height={32} />
          <span className="text-xl font-semibold">{BRANDING.name}</span>
        </div>
        <main className="flex flex-1 items-center justify-center py-10">
          <LoginPageContent />
        </main>
        <footer className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} {BRANDING.name}
        </footer>
      </div>
      <ShowcasePanel />
    </div>
  );
}
