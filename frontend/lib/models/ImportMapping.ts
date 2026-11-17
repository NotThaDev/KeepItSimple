import { del, FetchWrapperResponse, get, post, put } from "../fetchWrapper";
import { MappableField } from "./Transaction";

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

export const MAPPABLE_FIELD_ITEMS = Object.values(MappableField).map(
  (field) => ({ value: field, label: field }),
);

// The import-mappings API explains 400/409 as { message }.
export function mappingErrorMessage(errorData: unknown, fallback: string) {
  const message = (errorData as { message?: unknown } | undefined)?.message;
  return typeof message === "string" ? message : fallback;
}

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
