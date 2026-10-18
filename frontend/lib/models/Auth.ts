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

export async function register(
  username: string,
  email: string,
  password: string,
): Promise<FetchWrapperResponse<void>> {
  return await post<void>(
    "/api/auth/register",
    { username, email, password },
    false,
  );
}

// The refresh token travels in the HttpOnly cookie, not in the body.
export async function refreshToken(): Promise<FetchWrapperResponse<void>> {
  return await post<void>("/api/auth/refresh", {}, false);
}

export async function getMe(): Promise<FetchWrapperResponse<User>> {
  return await get<User>("/api/auth/me");
}
