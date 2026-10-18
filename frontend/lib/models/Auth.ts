import { FetchWrapperResponse, get, post } from "@/lib/fetchWrapper";

export interface User {
  id: string;
  userName?: string;
  email?: string;
}

export interface LoginResponse extends FetchWrapperResponse<void> {
  // Set when too many failed attempts locked the account.
  retryAfterSeconds?: number;
  // Set when the password is too old; the login form then asks for a new one.
  passwordExpired?: boolean;
}

// Login and refresh only set the HttpOnly auth cookies; there is no body. Logout is a Server Function (lib/actions/auth.ts).
export async function login(
  username: string,
  password: string,
): Promise<LoginResponse> {
  const response = await post<void>(
    "/api/auth/login",
    { username, password },
    false,
  );
  // 423 Locked: the body says how long the lockout still lasts.
  if (response.status === 423) {
    const lockout = response.errorData as
      { retryAfterSeconds?: number } | undefined;
    return { ...response, retryAfterSeconds: lockout?.retryAfterSeconds ?? 0 };
  }
  // 403 Forbidden: right password, but it has expired.
  if (response.status === 403) {
    return { ...response, passwordExpired: true };
  }
  return response;
}

export interface ChangeExpiredPasswordResponse extends FetchWrapperResponse<void> {
  // 400 ValidationProblemDetails: why the new password was rejected.
  newPasswordErrors?: string[];
}

// Sets the auth cookies on success, like login.
export async function changeExpiredPassword(
  username: string,
  currentPassword: string,
  newPassword: string,
): Promise<ChangeExpiredPasswordResponse> {
  const response = await post<void>(
    "/api/auth/change-expired-password",
    { username, currentPassword, newPassword },
    false,
  );
  if (response.status === 400) {
    const problem = response.errorData as
      { errors?: { newPassword?: string[] } } | undefined;
    return { ...response, newPasswordErrors: problem?.errors?.newPassword };
  }
  return response;
}

type FieldErrors = Partial<Record<"username" | "email", string[]>>;
export interface RegisterResponse extends FetchWrapperResponse<void> {
  // 409 ValidationProblemDetails: the fields already taken by another account.
  fieldErrors?: FieldErrors;
}

export async function register(
  username: string,
  email: string,
  password: string,
): Promise<RegisterResponse> {
  const response = await post<void>(
    "/api/auth/register",
    { username, email, password },
    false,
  );
  // 409 ValidationProblemDetails: its errors list the fields already taken.
  if (response.status === 409) {
    const problem = response.errorData as { errors?: FieldErrors } | undefined;
    return { ...response, fieldErrors: problem?.errors };
  }
  return response;
}

// The refresh token travels in the HttpOnly cookie, not in the body.
export async function refreshToken(): Promise<FetchWrapperResponse<void>> {
  return await post<void>("/api/auth/refresh", {}, false);
}

export async function getMe(): Promise<FetchWrapperResponse<User>> {
  return await get<User>("/api/auth/me");
}
