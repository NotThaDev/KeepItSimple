import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ACCESS_COOKIE = "kis_access";
const REFRESH_COOKIE = "kis_refresh";
const PUBLIC_PATHS = [
  "/login",
  "/confirm-email",
  "/forgot-password",
  "/reset-password",
];

// Prefetches and parallel page loads can find the same expired token at the same time.
// shortcut: dedupes within one server process only; across instances the API's grace window covers it.
const refreshing = new Map<string, Promise<RefreshResult>>();

// The API's Set-Cookie headers on success; "invalid" when it rejected the token; "unavailable" when it couldn't answer.
type RefreshResult = string[] | "invalid" | "unavailable";

function refreshOnce(refreshToken: string): Promise<RefreshResult> {
  let pending = refreshing.get(refreshToken);
  if (!pending) {
    pending = refresh(refreshToken).finally(() =>
      refreshing.delete(refreshToken),
    );
    refreshing.set(refreshToken, pending);
  }
  return pending;
}

async function refresh(refreshToken: string): Promise<RefreshResult> {
  try {
    const response = await fetch(
      `${process.env.API_BASE_URL}/api/auth/refresh`,
      {
        method: "POST",
        headers: { Cookie: `${REFRESH_COOKIE}=${refreshToken}` },
      },
    );
    if (response.status === 204) {
      return response.headers.getSetCookie();
    }
    return response.status === 401 ? "invalid" : "unavailable";
  } catch {
    return "unavailable";
  }
}

function redirectToLogin(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  // Explicit path "/": the API sets both cookies on "/", and a delete must match the path.
  response.cookies.set(ACCESS_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}

export async function proxy(request: NextRequest) {
  // Optimistic check only, no API call: the API verifies the token on every request.
  if (
    PUBLIC_PATHS.includes(request.nextUrl.pathname) ||
    request.cookies.has(ACCESS_COOKIE)
  ) {
    return NextResponse.next();
  }

  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return redirectToLogin(request);
  }

  const setCookies = await refreshOnce(refreshToken);
  // API down or failing: keep the cookies so the session survives the outage; the page shows its load errors.
  if (setCookies === "unavailable") {
    return NextResponse.next();
  }
  if (setCookies === "invalid") {
    return redirectToLogin(request);
  }

  // The page rendering now must see the new tokens too, not only the browser:
  // put them on this request's cookies...
  for (const setCookie of setCookies) {
    const [name, ...value] = setCookie.split(";")[0].split("=");
    request.cookies.set(name, value.join("="));
  }
  const response = NextResponse.next({ request: { headers: request.headers } });
  // ...and pass the API's Set-Cookie headers on unchanged, attributes included, so the browser keeps them.
  for (const setCookie of setCookies) {
    response.headers.append("Set-Cookie", setCookie);
  }
  return response;
}

export const config = {
  // Skip API calls (the rewrite handles them), Next assets, and files like /logo.png.
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
