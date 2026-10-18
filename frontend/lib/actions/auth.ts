"use server";

import { cookies } from "next/headers";

// Next.js docs (01-app/03-api-reference/01-directives/use-server.md): a Server Function used by a
// Client Component must live in a dedicated file with "use server" at the top, and every export
// of that file becomes a server endpoint. So it can't share lib/models/Auth.ts, whose calls run in the browser.
// Server Function: page scripts can't touch HttpOnly cookies, only the server can expire them.
// It runs while the cookies still exist, so proxy.ts lets the call through.
export async function logout() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("kis_refresh")?.value;
  if (refreshToken) {
    // Revoke the session on the API; a failure must not stop the logout.
    await fetch(`${process.env.API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: { Cookie: `kis_refresh=${refreshToken}` },
    }).catch(() => undefined);
  }

  // Cleared whatever the API answered, so the next visit needs a new login.
  // Explicit path "/": the API sets both cookies on "/", and a delete must match the path.
  cookieStore.set("kis_access", "", { path: "/", maxAge: 0 });
  cookieStore.set("kis_refresh", "", { path: "/", maxAge: 0 });
}
