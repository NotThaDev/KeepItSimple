"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { forgotPassword } from "@/lib/models/Auth";
import { EMAIL_PATTERN } from "../login/utils";

export function ForgotPasswordContent() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError("Email is required.");
      return;
    }
    if (!EMAIL_PATTERN.test(trimmed)) {
      setEmailError("Enter a valid email address.");
      return;
    }
    setEmailError(undefined);

    setLoading(true);
    const response = await forgotPassword(trimmed);
    setLoading(false);
    // The API answers 204 for known and unknown emails alike, so any error is a real failure.
    if (response.error) {
      toast.error(`Failed to send reset link: ${response.error}`);
      return;
    }
    setSent(true);
  }

  return (
    <div className="w-full max-w-sm space-y-8 short:space-y-5">
      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-semibold tracking-tight short:text-3xl">
          {sent ? "Check your inbox" : "Forgot password"}
        </h1>
        <p className="text-muted-foreground">
          {sent
            ? "If an account uses this email, we sent a link to reset the password. The link works for one day."
            : "Enter your account email and we'll send you a link to reset your password."}
        </p>
      </div>
      {!sent && (
        <form onSubmit={handleSubmit} noValidate>
          <FieldGroup className="space-y-3">
            <Field className="relative" data-invalid={emailError !== undefined}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                className="h-11 bg-background dark:bg-background"
                autoComplete="email"
                required
                aria-invalid={emailError !== undefined}
                aria-describedby={emailError ? "email-error" : undefined}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(undefined);
                }}
              />
              <FieldError
                id="email-error"
                className="absolute top-full ms-1 mt-1 text-xs leading-4"
              >
                {emailError}
              </FieldError>
            </Field>
            <Button
              type="submit"
              className="h-11 bg-indigo-600 text-white hover:bg-indigo-700"
              disabled={loading}
            >
              Send reset link
            </Button>
          </FieldGroup>
        </form>
      )}
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-indigo-600 hover:underline">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
