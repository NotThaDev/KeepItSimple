import type { Metadata } from "next";
import { AuthShell } from "../login/AuthShell";
import { ResetPasswordContent } from "./ResetPasswordContent";

// The token is in the URL; keep it out of the Referer header.
export const metadata: Metadata = {
  title: "Reset password",
  referrer: "no-referrer",
};

interface ResetPasswordPageProps {
  searchParams: Promise<{ userId?: string; token?: string }>;
}

export default async function ResetPasswordPage({
  searchParams,
}: Readonly<ResetPasswordPageProps>) {
  const { userId, token } = await searchParams;
  return (
    <AuthShell>
      <ResetPasswordContent userId={userId ?? ""} token={token ?? ""} />
    </AuthShell>
  );
}
