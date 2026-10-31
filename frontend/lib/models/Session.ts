import { del, FetchWrapperResponse, get } from "@/lib/fetchWrapper";

export interface Session {
  id: string;
  userAgent: string | null;
  createdAt: Date;
  lastUsedAt: Date;
  current: boolean;
}

interface SessionJson extends Omit<Session, "createdAt" | "lastUsedAt"> {
  createdAt: string;
  lastUsedAt: string;
}

export async function getSessions(): Promise<FetchWrapperResponse<Session[]>> {
  const response = await get<SessionJson[]>("/api/auth/sessions");
  return {
    ...response,
    data: response.data?.map((s) => ({
      ...s,
      createdAt: new Date(s.createdAt),
      lastUsedAt: new Date(s.lastUsedAt),
    })),
  };
}

export async function revokeSession(
  id: string,
): Promise<FetchWrapperResponse<void>> {
  return await del<void>(`/api/auth/sessions/${encodeURIComponent(id)}`);
}

export async function revokeOtherSessions(): Promise<FetchWrapperResponse<void>> {
  return await del<void>("/api/auth/sessions");
}
