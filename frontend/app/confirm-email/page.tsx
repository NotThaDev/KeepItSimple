import type { Metadata } from "next";
import { AuthShell } from "../login/AuthShell";
import { ConfirmEmailContent } from "./ConfirmEmailContent";

// The token is in the URL; keep it out of the Referer header.
export const metadata: Metadata = {
  title: "Confirm email",
  referrer: "no-referrer",
};

interface ConfirmEmailPageProps {
  searchParams: Promise<{ userId?: string; token?: string }>;
}

export default async function ConfirmEmailPage({
  searchParams,
}: Readonly<ConfirmEmailPageProps>) {
  const { userId = "", token = "" } = await searchParams;
  return (
    <AuthShell>
      <ConfirmEmailContent userId={userId} token={token} />
    </AuthShell>
  );
}
