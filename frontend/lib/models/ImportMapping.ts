import { del, FetchWrapperResponse, get, post, put } from "../fetchWrapper";
import type { MappableField } from "./Transaction";

export interface ImportMappingColumn {
  header: string;
  targetField: MappableField;
}

export interface ImportMapping {
  id: number;
  name: string;
  columns: ImportMappingColumn[];
  updatedAt: string;
}

export type ImportMappingInput = Pick<ImportMapping, "name" | "columns">;

export async function getImportMappings(): Promise<
  FetchWrapperResponse<ImportMapping[]>
> {
  return await get<ImportMapping[]>("/api/import-mappings");
}

export async function createImportMapping(
  input: ImportMappingInput,
): Promise<FetchWrapperResponse<ImportMapping>> {
  return await post<ImportMapping>("/api/import-mappings", input);
}

export async function updateImportMapping(
  id: number,
  input: ImportMappingInput,
): Promise<FetchWrapperResponse<ImportMapping>> {
  return await put<ImportMapping>(`/api/import-mappings/${id}`, input);
}

export async function deleteImportMapping(
  id: number,
): Promise<FetchWrapperResponse<void>> {
  return await del(`/api/import-mappings/${id}`);
}
