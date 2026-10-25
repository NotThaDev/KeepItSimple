import type { Metadata } from "next";
import { AuthShell } from "./AuthShell";
import { LoginPageContent } from "./LoginPageContent";

export const metadata: Metadata = { title: "Login" };

export default function LoginPage() {
  return (
    <AuthShell>
      <LoginPageContent />
    </AuthShell>
  );
}
