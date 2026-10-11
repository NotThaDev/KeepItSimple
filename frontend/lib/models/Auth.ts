import { FetchWrapperResponse, post } from "@/lib/fetchWrapper";

export interface User {
  id: string;
  userName?: string;
  email?: string;
}

export async function login(
  username: string,
  password: string,
): Promise<FetchWrapperResponse<User>> {
  return await post<User>("/api/auth/login", { username, password });
}

export async function register(
  username: string,
  email: string,
  password: string,
): Promise<FetchWrapperResponse<User>> {
  return await post<User>("/api/auth/register", { username, email, password });
}
