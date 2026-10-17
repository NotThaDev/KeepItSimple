import { cache } from "react";
import { getMe, User } from "@/lib/models/Auth";

// Data Access Layer, per the Next.js auth guide (node_modules/next/dist/docs/01-app/02-guides/authentication.md):
// keep session checks in one server-side module instead of in layouts, because layouts don't re-render
// on navigation, and memoize them with React cache() so a render pass calls the API once.
// Server components only: in a Client Component cache() keeps nothing between calls.
// The check itself is in fetchWrapper, which turns any server-side 401 into redirect("/login").
// Kept apart from lib/models so future server-only checks (ownership, roles) have a home.
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const response = await getMe();
  // null only when the API couldn't answer; a 401 has already redirected.
  return response.data ?? null;
});
