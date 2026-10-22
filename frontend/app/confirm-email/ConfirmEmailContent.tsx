"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { confirmEmail } from "@/lib/models/Auth";

interface ConfirmEmailContentProps {
  userId: string;
  token: string;
}

type ConfirmState = "confirming" | "confirmed" | "failed";

export function ConfirmEmailContent({
  userId,
  token,
}: Readonly<ConfirmEmailContentProps>) {
  const [state, setState] = useState<ConfirmState>(
    userId && token ? "confirming" : "failed",
  );
  // StrictMode runs effects twice in development; the link is single-use, so send it once.
  const sent = useRef(false);

  useEffect(() => {
    if (!userId || !token || sent.current) return;
    sent.current = true;
    confirmEmail(userId, token).then((response) => {
      setState(response.error ? "failed" : "confirmed");
    });
  }, [userId, token]);

  return (
    <div className="w-full max-w-sm space-y-8 short:space-y-5">
      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-semibold tracking-tight short:text-3xl">
          {state === "confirming" && "Confirming your email…"}
          {state === "confirmed" && "Email confirmed"}
          {state === "failed" && "Link not valid"}
        </h1>
        <p className="text-muted-foreground">
          {state === "confirming" && "This only takes a moment."}
          {state === "confirmed" && "Your account is ready. Log in to continue."}
          {state === "failed" &&
            "This confirmation link is invalid or has expired. Log in to get a new one."}
        </p>
      </div>
      {state !== "confirming" && (
        <Button asChild className="h-11 w-full bg-indigo-600 text-white hover:bg-indigo-700">
          <Link href="/login">
            {state === "confirmed" ? "Go to log in" : "Back to log in"}
          </Link>
        </Button>
      )}
    </div>
  );
}
