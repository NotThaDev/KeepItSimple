import type { ReactNode } from "react";
import type { User } from "@/lib/models/Auth";

export interface UserIdentityContextState {
  // null when the API couldn't answer; the menu still works so the user can log out.
  user: User | null;
}

export interface UserIdentityContextAction {
  logout: () => Promise<void>;
}

export type UserIdentityContext = UserIdentityContextState &
  UserIdentityContextAction;

export interface UserIdentityProviderProps {
  user: User | null;
  children: ReactNode;
}
