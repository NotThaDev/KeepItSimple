"use client";

import { FormEvent, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  changeExpiredPassword,
  login,
  LoginResponse,
  register,
  RegisterResponse,
} from "@/lib/models/Auth";
import { LockoutNotice } from "./LockoutNotice";
import { PasswordRequirements } from "./PasswordRequirements";
import { EMAIL_PATTERN, meetsPasswordRules } from "./utils";

// Absolute inside the gap below the field, so a message appearing doesn't move the form.
const FIELD_ERROR_CLASS = "absolute top-full ms-1 mt-1 text-xs leading-4";

type FormField = "username" | "email" | "password";
type FieldErrors = Partial<Record<FormField, string>>;

export function LoginPageContent() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // The expired password, kept to prove who is asking; non-null means the form asks for a new password.
  const [expiredPassword, setExpiredPassword] = useState<string | null>(null);
  const isExpired = expiredPassword !== null;
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  // Epoch ms when the account lockout ends; null when not locked.
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const clearLockout = useCallback(() => setLockedUntil(null), []);
  const isInvalid = (field: FormField) => errors[field] !== undefined;

  const clearError = useCallback((field: FormField) => {
    setErrors((current) => ({ ...current, [field]: undefined }));
  }, []);

  const validate = useCallback(() => {
    const found: FieldErrors = {};
    if (!username.trim()) found.username = "Username is required.";
    if (isRegister) {
      if (!email.trim()) found.email = "Email is required.";
      else if (!EMAIL_PATTERN.test(email))
        found.email = "Enter a valid email address.";

    }
    if (isRegister || isExpired) {
      if (!meetsPasswordRules(password)) found.password = "";
    } else if (!password) {
      found.password = "Password is required.";
    }
    return found;
  }, [username, email, password, isRegister, isExpired]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const invalid = validate();
    setErrors(invalid);
    if (Object.keys(invalid).length > 0) return;

    setLoading(true);
    // Narrowed on expiredPassword itself: TS does not narrow through the isExpired boolean.
    if (expiredPassword !== null) {
      const changed = await changeExpiredPassword(username, expiredPassword, password);
      if (changed.error) {
        setLoading(false);
        if (changed.newPasswordErrors) {
          setErrors({ password: changed.newPasswordErrors[0] });
          return;
        }
        toast.error(`Failed to update password: ${changed.error}`);
        return;
      }
      router.push("/");
      router.refresh();
      return;
    }
    // Each response type only adds optional fields, so one variable fits both.
    const response: RegisterResponse & LoginResponse = isRegister
      ? await register(username, email, password)
      : await login(username, password);

    if (response.error) {
      setLoading(false);
      if (response.passwordExpired) {
        setExpiredPassword(password);
        setPassword("");
        setErrors({});
        return;
      }
      if (response.retryAfterSeconds !== undefined) {
        setLockedUntil(Date.now() + response.retryAfterSeconds * 1000);
        return;
      }
      const taken = response.fieldErrors;
      if (taken) {
        setErrors({ username: taken.username?.[0], email: taken.email?.[0] });
        return;
      }

      setErrors({ username: "", email: "", password: "" });
      toast.error(
        isRegister
          ? `Failed to register: ${response.error}`
          : "Invalid username or password",
      );
      return;
    }

    // Registering sets no cookies, so log in right away instead of bouncing back to /login.
    if (isRegister) {
      const loginResponse = await login(username, password);
      if (loginResponse.error) {
        setLoading(false);
        toast.error(`Failed to log in: ${loginResponse.error}`);
        return;
      }
    }

    router.push("/");
    // Server components read the new auth cookies on the next render.
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm space-y-8 short:space-y-5">
      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-semibold tracking-tight short:text-3xl">
          {isRegister
            ? "Create account"
            : isExpired
              ? "Set a new password"
              : "Welcome back"}
        </h1>
        <p className="text-muted-foreground">
          {isRegister
            ? "Fill in your details to get started."
            : isExpired
              ? "Your password has expired. Choose a new one to continue."
              : "Enter your credentials to access your account."}
        </p>
      </div>
      <form onSubmit={handleSubmit} noValidate>
        <FieldGroup className="space-y-3">
          <Field className="relative" data-invalid={isInvalid("username")}>
            <FieldLabel htmlFor="username">Username</FieldLabel>
            <Input
              id="username"
              className="h-11 bg-background dark:bg-background"
              autoComplete="username"
              disabled={isExpired}
              required
              aria-invalid={isInvalid("username")}
              aria-describedby={errors.username ? "username-error" : undefined}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                clearError("username");
                // The lockout belongs to the account that was typed.
                clearLockout();
              }}
            />
            <FieldError id="username-error" className={FIELD_ERROR_CLASS}>
              {errors.username}
            </FieldError>
          </Field>
          {isRegister && (
            <Field className="relative" data-invalid={isInvalid("email")}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                className="h-11 bg-background dark:bg-background"
                autoComplete="email"
                required
                aria-invalid={isInvalid("email")}
                aria-describedby={errors.email ? "email-error" : undefined}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearError("email");
                }}
              />
              <FieldError id="email-error" className={FIELD_ERROR_CLASS}>
                {errors.email}
              </FieldError>
            </Field>
          )}
          <Field className="relative" data-invalid={isInvalid("password")}>
            <FieldLabel htmlFor="password">
              {isExpired ? "New password" : "Password"}
            </FieldLabel>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                className="h-11 bg-background pr-10 dark:bg-background"
                autoComplete={
                  isRegister || isExpired ? "new-password" : "current-password"
                }
                required
                aria-invalid={isInvalid("password")}
                aria-describedby={
                  isRegister || isExpired
                    ? "password-rules"
                    : errors.password
                      ? "password-error"
                      : undefined
                }
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearError("password");
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
            {(isRegister || isExpired) && (
              <PasswordRequirements id="password-rules" password={password} />
            )}
            <FieldError id="password-error" className={FIELD_ERROR_CLASS}>
              {errors.password}
            </FieldError>
          </Field>
          {lockedUntil !== null && !isRegister && (
            <LockoutNotice until={lockedUntil} onExpire={clearLockout} />
          )}
          <Button
            type="submit"
            className="h-11 bg-indigo-600 text-white hover:bg-indigo-700"
            disabled={loading}
          >
            {isRegister ? "Register" : isExpired ? "Update password" : "Log in"}
          </Button>
          {isExpired ? (
            <p className="text-center text-sm text-muted-foreground">
              <button
                type="button"
                className="font-medium text-indigo-600 hover:underline"
                onClick={() => {
                  setExpiredPassword(null);
                  setPassword("");
                  setErrors({});
                }}
              >
                Back to log in
              </button>
            </p>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              {isRegister
                ? "Already have an account? "
                : "Don't have an account? "}
              <button
                type="button"
                className="font-medium text-indigo-600 hover:underline"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setErrors({});
                }}
              >
                {isRegister ? "Log in" : "Register now"}
              </button>
            </p>
          )}
        </FieldGroup>
      </form>
    </div>
  );
}
