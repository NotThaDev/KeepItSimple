import { AuthShell } from "../login/AuthShell";
import { ForgotPasswordContent } from "./ForgotPasswordContent";

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <ForgotPasswordContent />
    </AuthShell>
  );
}
