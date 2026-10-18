import { FetchWrapperResponse, get, post } from "@/lib/fetchWrapper";

export interface User {
  id: string;
  userName?: string;
  email?: string;
}

// Login and refresh only set the HttpOnly auth cookies; there is no body. Logout is a Server Function (lib/actions/auth.ts).
export async function login(
  username: string,
  password: string,
): Promise<FetchWrapperResponse<void>> {
  return await post<void>("/api/auth/login", { username, password }, false);
}

type FieldErrors = Partial<Record<"username" | "email", string[]>>;
export interface RegisterResponse extends FetchWrapperResponse<void> {
  // 409 ValidationProblemDetails: the fields already taken by another account.
  fieldErrors?: FieldErrors;
}

// Calls fetch directly instead of fetchWrapper: this is the only call that needs the error body.
// Browser only (the login page): the relative URL goes through the /api rewrite.
export async function register(
  username: string,
  email: string,
  password: string,
): Promise<RegisterResponse> {
  let response: Response;
  try {
    response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
  } catch {
    return { error: "Server is unreachable", status: 0 };
  }

  if (response.ok) return { status: response.status };

  const body: { errors?: FieldErrors } | undefined =
    response.status === 409
      ? await response.json().catch(() => undefined)
      : undefined;
  return {
    error: `Request failed with status ${response.status}`,
    fieldErrors: body?.errors,
    status: response.status,
  };
}

// The refresh token travels in the HttpOnly cookie, not in the body.
export async function refreshToken(): Promise<FetchWrapperResponse<void>> {
  return await post<void>("/api/auth/refresh", {}, false);
}

export async function getMe(): Promise<FetchWrapperResponse<User>> {
  return await get<User>("/api/auth/me");
}
