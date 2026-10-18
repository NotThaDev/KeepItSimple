# Accounts: login, access token, refresh token

Login gives the browser two tokens with different jobs. Both are HttpOnly cookies, so page scripts never see them. This follows the Next.js authentication guide.

| | Access token | Refresh token |
|---|---|---|
| What it is | Signed JWT (`TokenService`) | 32 random bytes, hex encoded |
| Cookie | `kis_access` | `kis_refresh` |
| Lifetime | `JwtSettings:ExpiryMinutes`. The cookie's `Max-Age` is 30 s shorter, so the browser drops it before the API would reject it | `JwtSettings:RefreshExpiryDays` (14), renewed on each refresh |
| What the server stores | Nothing: the signature proves it | SHA-256 hash in `identity.RefreshTokens` |
| Can be revoked | No, it lives until it expires | Yes |

Both cookies have `HttpOnly`, `SameSite=Lax` and `Path=/`, and `Secure` when the request is HTTPS. They use `Max-Age` rather than `Expires`: the browser counts `Max-Age` with its own clock, so a wrong client clock doesn't matter. `TokenService.AuthCookieOptions` builds the options for both.

The JWT is read from the `Authorization: Bearer` header when there is one; this is how server components and Swagger send it. Otherwise it's read from the `kis_access` cookie (`JwtBearerEvents.OnMessageReceived` in `AuthSetup`).

## Endpoints (`/api/auth`)

- `POST login`:
  - checks the password and revokes the user's other refresh rows (one session per user);
  - creates a new row, sets both cookies, and returns 204;
  - the other browser gets a 401 on its next refresh, but keeps its current access token until it expires;
  - 5 wrong passwords lock the account for 15 minutes (`IdentitySetup`). While locked, every attempt, even with the right password, gets **423 Locked** with `LockoutResponse { retryAfterSeconds }`. Seconds rather than an end timestamp, so the client's countdown doesn't depend on its clock. This tells a caller the username exists, but only after 5 failed tries on it; an unknown username stays a plain 401.
- `POST refresh`: no body; reads `kis_refresh`.
  - **Valid**: in one transaction, the row is revoked and points at its replacement (`ReplacedByHash`), and the new row is inserted. Both cookies are set again.
  - **Unknown, expired or revoked** (for example after logout): 401, and both cookies are cleared.
  - **Rotated less than 10 s ago, and its successor is still active** (grace period): a new row and cookies are issued. Parallel requests that found the same expired token (prefetches, several tabs) don't log the user out.
  - **Rotated earlier** (reuse): 401 and **every active session of that user is revoked**. Only the attacker or the real user can hold the newer token, and the server can't tell which, so both have to log in again.
- `POST logout`: revokes the cookie's row and clears both cookies. Always 204, even without a cookie.
- Login and a valid refresh also delete the user's expired rows. Revoked rows stay until they expire: a reused token is only caught while its row exists.
- `GET me`: the signed-in user (`UserResponse`), read from the JWT's `sub` claim. Returns 401 when that user no longer exists.

```mermaid
sequenceDiagram
  participant Browser
  participant Next as Next.js (proxy.ts, pages)
  participant API
  Browser->>API: POST /api/auth/login (through the Next rewrite)
  API-->>Browser: 204 + Set-Cookie kis_access, kis_refresh=R1
  Browser->>Next: GET /pockets (cookies)
  Next->>API: GET /api/pocket, Bearer kis_access
  Note over Browser: kis_access expires (Max-Age)
  Browser->>Next: GET /pockets (only kis_refresh=R1)
  Next->>API: POST /api/auth/refresh (R1)
  API-->>Next: 204 + new cookies (R1 replaced by R2)
  Next-->>Browser: page rendered with the new token + Set-Cookie
  Browser->>API: POST refresh with stolen R1, 10 s later
  API-->>Browser: 401, all sessions of the user revoked
```

## Which endpoints need a token

All of them, through a fallback policy in `AuthSetup`: any endpoint without authorization metadata requires a signed-in user, so new controllers are protected by default.

Only `register`, `login`, `refresh` and `logout` are `[AllowAnonymous]`. `refresh` and `logout` have to be anonymous, because they run when the access token may already have expired; the cookie identifies the session there. `AuthorizationCoverageTests` fails if any other action allows anonymous access.

## In the UI

The browser only talks to the Next app. `next.config.ts` rewrites `/api/*` to `API_BASE_URL`, so the cookies are first-party and the API needs no CORS.

- **Login page**: a 423 shows `LockoutNotice` with a live countdown (`m:ss`) instead of the error toast. It goes away when the time runs out or the username changes. `fetchWrapper` keeps the JSON body of failed responses in `errorData`; `login()` reads the lockout from it and `register()` the taken fields of a 409.
- **`frontend/proxy.ts`** is the optimistic check, and it never calls the API when `kis_access` is present.
  - `/login` is public.
  - With `kis_access`, the request goes on.
  - With only `kis_refresh`, the proxy refreshes, at most once per token per server process. It writes the new cookies to the current request, so this render already uses them, and to the response, so the browser keeps them.
  - With neither cookie, or when the API rejects the refresh token (401), the user is redirected to `/login` and both cookies are cleared.
  - When the API is down or fails (network error, 5xx), the cookies are kept and the request goes on. The session survives the outage, and the page shows its load errors.
- **Logout (`NavUser`)** calls the `logout` Server Function (`frontend/lib/actions/auth.ts`). Only the server can expire HttpOnly cookies. It sends the refresh cookie to the API to revoke the session, then clears both cookies even if that call fails, so the next visit needs a new login. It runs while the cookies still exist, so `proxy.ts` lets the call through.
- **`frontend/lib/fetchWrapper.ts`** behaves differently on each side:
  - **On the server**, it sends `kis_access` as `Bearer`, and a 401 becomes `redirect("/login")`. That makes every server-side data load the real guard.
  - **In the browser**, it calls relative `/api/...`, and the cookies go along automatically. A 401 triggers one refresh (`refreshOnce`, never two at a time), then one retry. If the refresh fails, the user is sent to `/login`.
- **`frontend/lib/dal.ts`**: `getCurrentUser()` (React `cache`, so once per render) loads `/me`. The `(app)` layout passes the result to `UserIdentityProvider` (`frontend/stores/userIdentity`). Client components read it, and the `logout` action, with `useUserIdentityContext()`.

## Known limits

- The proxy trusts a present `kis_access` without checking it, and the API only checks the signature. Revoking a session takes effect when the access token expires, up to `ExpiryMinutes`. #149 tracks making it immediate.
- Each grace-period refresh leaves one extra active refresh row for the session, until it expires or the next login. The `SessionId` in #149 fixes it.
- Through the rewrite, the API sees HTTP, so in production behind TLS `Secure` would be off. That needs `UseForwardedHeaders` when we deploy.
- The proxy dedupes refreshes within one server process. With several instances, only the grace period protects parallel refreshes.
- Data isn't filtered by the signed-in user yet (plan step 3).
