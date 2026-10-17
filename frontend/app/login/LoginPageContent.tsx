"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { login, register } from "@/lib/models/Auth";

export function LoginPageContent() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    const response = isRegister
      ? await register(username, email, password)
      : await login(username, password);
    setLoading(false);

    if (response.error) {
      toast.error(
        isRegister
          ? `Failed to register: ${response.error}`
          : "Invalid username or password",
      );
      return;
    }

    // shortcut: no token/session stored yet, wire it in with the JWT work.
    toast.success(isRegister ? "Account created" : "Logged in");
    router.push("/");
  }

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">
          {isRegister ? "Create account" : "Welcome back"}
        </h1>
        <p className="text-muted-foreground">
          {isRegister
            ? "Fill in your details to get started."
            : "Enter your username and password to access your account."}
        </p>
      </div>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="username">Username</FieldLabel>
            <Input
              id="username"
              className="h-11"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </Field>
          {isRegister && (
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                className="h-11"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
          )}
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                className="h-11 pr-10"
                autoComplete={isRegister ? "new-password" : "current-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
          </Field>
          <Button
            type="submit"
            className="h-11 bg-indigo-600 text-white hover:bg-indigo-700"
            disabled={loading}
          >
            {isRegister ? "Register" : "Log in"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {isRegister ? "Already have an account? " : "Don't have an account? "}
            <button
              type="button"
              className="font-medium text-indigo-600 hover:underline"
              onClick={() => setIsRegister(!isRegister)}
            >
              {isRegister ? "Log in" : "Register now"}
            </button>
          </p>
        </FieldGroup>
      </form>
    </div>
  );
}
