"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import { logout as logoutSession } from "@/lib/actions/auth";
import type {
  UserIdentityContext as UserIdentityContextValue,
  UserIdentityProviderProps,
} from "./types";

const UserIdentityContext = createContext<UserIdentityContextValue | null>(
  null,
);

// The user comes from the server layout (getCurrentUser), so the browser makes no extra /me call.
export function UserIdentityProvider({
  user,
  children,
}: Readonly<UserIdentityProviderProps>) {
  const router = useRouter();

  const logout = useCallback(async () => {
    try {
      await logoutSession();
    } finally {
      // Even if the call failed (for example the session was already gone), leave the app.
      router.push("/login");
      router.refresh();
    }
  }, [router]);

  const value = useMemo(() => ({ user, logout }), [user, logout]);

  return (
    <UserIdentityContext.Provider value={value}>
      {children}
    </UserIdentityContext.Provider>
  );
}

export function useUserIdentityContext() {
  const context = useContext(UserIdentityContext);
  if (!context) {
    throw new Error(
      "useUserIdentityContext must be used within UserIdentityProvider",
    );
  }
  return context;
}
