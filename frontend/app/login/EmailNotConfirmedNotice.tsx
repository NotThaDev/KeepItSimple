"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MailWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resendConfirmation } from "@/lib/models/Auth";

interface EmailNotConfirmedNoticeProps {
  username: string;
}

export function EmailNotConfirmedNotice({
  username,
}: Readonly<EmailNotConfirmedNoticeProps>) {
  const [sending, setSending] = useState(false);

  async function handleResend() {
    setSending(true);
    const response = await resendConfirmation(username);
    setSending(false);
    if (response.error) {
      toast.error("Could not send the email. Try again later.");
      return;
    }
    // The API answers the same whether or not it sent one (unknown user, throttled), so don't promise a new email.
    toast.success("If your email is still unconfirmed, a new link is on its way.");
  }

  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-lg border border-indigo-600/30 bg-indigo-600/10 p-3 text-sm text-foreground"
    >
      <MailWarning className="mt-0.5 size-4 shrink-0 text-indigo-600" aria-hidden />
      <p>
        Confirm your email address before logging in. Check your inbox for the
        link.{" "}
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-indigo-600"
          disabled={sending}
          onClick={handleResend}
        >
          Resend email
        </Button>
      </p>
    </div>
  );
}
