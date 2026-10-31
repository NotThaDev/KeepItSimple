"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { resetPassword } from "@/lib/models/Auth";
import { PasswordRequirements } from "../login/PasswordRequirements";
import { meetsPasswordRules } from "../login/utils";

interface ResetPasswordContentProps {
  userId: string;
  token: string;
}

type ResetState = "form" | "done" | "invalid";
type FormField = "password" | "confirm";
type FieldErrors = Partial<Record<FormField, string>>;

// Field error inside the gap below the field, like the login form.
const FIELD_ERROR_CLASS = "absolute top-full ms-1 mt-1 text-xs leading-4";

export function ResetPasswordContent({
  userId,
  token,
}: Readonly<ResetPasswordContentProps>) {
  const router = useRouter();
  const pathname = usePathname();
  // Captured on the first render: the URL is cleared below, so the props turn empty afterwards.
  const [link] = useState({ userId, token });
  const [state, setState] = useState<ResetState>(
    userId && token ? "form" : "invalid",
  );
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  // Drop the token from the address bar and history; the captured link keeps it.
  useEffect(() => {
    router.replace(pathname);
  }, [router, pathname]);

  const isInvalid = (field: FormField) => errors[field] !== undefined;

  function validate() {
    const found: FieldErrors = {};
    if (!password) found.password = "Password is required.";
    else if (!meetsPasswordRules(password)) found.password = "";
    if (confirm !== password) found.confirm = "Passwords do not match.";
    return found;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const invalid = validate();
    setErrors(invalid);
    if (Object.keys(invalid).length > 0) return;

    setLoading(true);
    const response = await resetPassword(link.userId, link.token, password);
    setLoading(false);
    if (!response.error) {
      setState("done");
      return;
    }
    if (response.newPasswordErrors) {
      setErrors({ password: response.newPasswordErrors[0] });
      return;
    }
    // A bad, expired or used link answers 400 with a plain text body.
    if (response.status === 400) {
      setState("invalid");
      return;
    }
    toast.error(`Failed to update password: ${response.error}`);
  }

  if (state === "done") {
    return (
      <div className="w-full max-w-sm space-y-8 short:space-y-5">
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-semibold tracking-tight short:text-3xl">
            Password updated
          </h1>
          <p className="text-muted-foreground">
            Log in with your new password. Other devices will be signed out within the hour.
          </p>
        </div>
        <Button asChild className="h-11 w-full bg-indigo-600 text-white hover:bg-indigo-700">
          <Link href="/login">Go to log in</Link>
        </Button>
      </div>
    );
  }

  if (state === "invalid") {
    return (
      <div className="w-full max-w-sm space-y-8 short:space-y-5">
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-semibold tracking-tight short:text-3xl">
            Link not valid
          </h1>
          <p className="text-muted-foreground">
            This reset link is invalid, expired or already used.
          </p>
        </div>
        <Button asChild className="h-11 w-full bg-indigo-600 text-white hover:bg-indigo-700">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-8 short:space-y-5">
      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-semibold tracking-tight short:text-3xl">
          Set a new password
        </h1>
        <p className="text-muted-foreground">
          Choose a new password for your account.
        </p>
      </div>
      <form onSubmit={handleSubmit} noValidate>
        <FieldGroup className="space-y-3">
          <Field className="relative" data-invalid={isInvalid("password")}>
            <FieldLabel htmlFor="password">New password</FieldLabel>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                className="h-11 bg-background pr-10 dark:bg-background"
                autoComplete="new-password"
                required
                aria-invalid={isInvalid("password")}
                aria-describedby="password-rules"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((current) => ({ ...current, password: undefined }));
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </Button>
            </div>
            <PasswordRequirements id="password-rules" password={password} />
            <FieldError id="password-error" className={FIELD_ERROR_CLASS}>
              {errors.password}
            </FieldError>
          </Field>
          <Field className="relative" data-invalid={isInvalid("confirm")}>
            <FieldLabel htmlFor="confirm">Confirm new password</FieldLabel>
            <Input
              id="confirm"
              type={showPassword ? "text" : "password"}
              className="h-11 bg-background dark:bg-background"
              autoComplete="new-password"
              required
              aria-invalid={isInvalid("confirm")}
              aria-describedby={errors.confirm ? "confirm-error" : undefined}
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                setErrors((current) => ({ ...current, confirm: undefined }));
              }}
            />
            <FieldError id="confirm-error" className={FIELD_ERROR_CLASS}>
              {errors.confirm}
            </FieldError>
          </Field>
          <Button
            type="submit"
            className="h-11 bg-indigo-600 text-white hover:bg-indigo-700"
            disabled={loading}
          >
            Update password
          </Button>
        </FieldGroup>
      </form>
    </div>
  );
}
