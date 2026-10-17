import { redirect } from "next/navigation";
import { refreshToken } from "./models/Auth";

export interface FetchWrapperResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

// The browser goes through the same-origin /api rewrite and sends the auth cookies itself.
// Server components have no browser cookies: they read kis_access and call the API directly.
const isBrowser = typeof window !== "undefined";

let refreshing: Promise<boolean> | null = null;

// One refresh at a time: a second parallel refresh would send the token that was just
// rotated, which the API treats as stolen and revokes every session of the user.
function refreshOnce(): Promise<boolean> {
  refreshing ??= refreshToken()
    .then((response) => response.status === 204)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

async function serverAccessToken(): Promise<string | undefined> {
  const { cookies } = await import("next/headers");
  return (await cookies()).get("kis_access")?.value;
}

async function fetch<T>(
  method: string,
  endpoint: string,
  body?: unknown,
  withAuth: boolean = true,
  isRetry: boolean = false,
): Promise<FetchWrapperResponse<T>> {
  const baseUrl = isBrowser ? "" : process.env.API_BASE_URL;
  const fullUrl = `${baseUrl}${endpoint}`;

  const isFormData = body instanceof FormData;
  const headers: Record<string, string> = {};
  // FormData gets no Content-Type: the browser sets multipart/form-data with its boundary.
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (withAuth && !isBrowser) {
    const token = await serverAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = isFormData ? body : JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await globalThis.fetch(fullUrl, options);
  } catch {
    return {
      error: "Server is unreachable",
      status: 0,
    };
  }

  if (response.status === 401 && withAuth) {
    if (!isBrowser) {
      // proxy.ts already refreshed, so a 401 here means the session is gone.
      // redirect() works by throwing, so it must stay outside any try/catch.
      redirect("/login");
    }

    // Expired or revoked access token: refresh once, then retry the request once.
    if (!isRetry && (await refreshOnce())) {
      return fetch<T>(method, endpoint, body, withAuth, true);
    }

    // Plain module code, no useRouter here; a full load also drops any client state of the old session.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/login");
    return {
      error: "Unauthorized. Please log in again.",
      status: 401,
    };
  }

  if (!response.ok) {
    console.error(`Request to ${fullUrl} failed with status ${response.status}`);
    return {
      error: `Request failed with status ${response.status}`,
      status: response.status,
    };
  }

  // Some successful responses (for example DELETE 204) have no body.
  if (response.status === 204) {
    return {
      status: response.status,
    };
  }

  try {
    const responseText = await response.text();
    if (!responseText.trim()) {
      return {
        status: response.status,
      };
    }

    const content = JSON.parse(responseText) as T;
    return {
      data: content,
      status: response.status,
    };
  } catch {
    return {
      error: "Server is unreachable",
      status: 0,
    };
  }
}

export function get<T>(endpoint: string, withAuth: boolean = true) {
  return fetch<T>("GET", endpoint, undefined, withAuth);
}

export function post<T>(
  endpoint: string,
  body: unknown,
  withAuth: boolean = true,
) {
  return fetch<T>("POST", endpoint, body, withAuth);
}

export function put<T>(
  endpoint: string,
  body: unknown,
  withAuth: boolean = true,
) {
  return fetch<T>("PUT", endpoint, body, withAuth);
}

export function del<T>(endpoint: string, withAuth: boolean = true) {
  return fetch<T>("DELETE", endpoint, undefined, withAuth);
}
