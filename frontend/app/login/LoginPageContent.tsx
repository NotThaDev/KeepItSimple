"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { login, register } from "@/lib/models/Auth";

export function LoginPageContent() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <Card className="w-full max-w-sm">
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="username">Username</FieldLabel>
              <Input
                id="username"
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
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
            )}
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete={isRegister ? "new-password" : "current-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <Button type="submit" disabled={loading}>
              {isRegister ? "Register" : "Log in"}
            </Button>
            <Button
              type="button"
              variant="link"
              onClick={() => setIsRegister(!isRegister)}
            >
              {isRegister
                ? "Already have an account? Log in"
                : "No account? Register"}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
