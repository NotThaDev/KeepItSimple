import { del, FetchWrapperResponse, get, post, put } from "../fetchWrapper";

export interface Pocket {
  id: number;
  balance: number;
  currency: string;
  name: string;
  iban: string;
}

export async function getPockets(): Promise<FetchWrapperResponse<Pocket[]>> {
  return await get<Pocket[]>("/api/pocket");
}

export async function createPocket(
  pocket: Omit<Pocket, "id">,
): Promise<FetchWrapperResponse<Pocket>> {
  return await post<Pocket>("/api/pocket", pocket);
}

export async function updatePocket(
  id: number,
  pocket: Omit<Pocket, "id">,
): Promise<FetchWrapperResponse<Pocket>> {
  return await put<Pocket>(`/api/pocket/${id}`, pocket);
}

export async function deletePocket(
  id: number,
): Promise<FetchWrapperResponse<void>> {
  return await del(`/api/pocket/${id}`);
}
