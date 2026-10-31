import type { Metadata } from "next";
import { AuthShell } from "../login/AuthShell";
import { ForgotPasswordContent } from "./ForgotPasswordContent";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <ForgotPasswordContent />
    </AuthShell>
  );
}
