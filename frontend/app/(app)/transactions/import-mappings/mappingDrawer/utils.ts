import { ImportMapping } from "@/lib/models/ImportMapping";
import { MappableField } from "@/lib/models/Transaction";

export interface MappingRow {
  key: string;
  header: string;
  targetField: MappableField;
}

export interface MappingValidation {
  messages: string[];
  nameInvalid: boolean;
  invalidRowKeys: string[];
}

export const MAX_COLUMNS = 200;
export const MAX_NAME_LENGTH = 100;

export const normalizeHeader = (header: string) => header.trim().toLowerCase();

export const validateMapping = (
  name: string,
  rows: MappingRow[],
): MappingValidation | null => {
  const messages: string[] = [];
  const invalidRowKeys = new Set<string>();
  const trimmedName = name.trim();
  const nameInvalid =
    trimmedName === "" || trimmedName.length > MAX_NAME_LENGTH;

  if (trimmedName === "") {
    messages.push("A name is required.");
  } else if (trimmedName.length > MAX_NAME_LENGTH) {
    messages.push(`The name must be ${MAX_NAME_LENGTH} characters or fewer.`);
  }

  if (rows.length < 1 || rows.length > MAX_COLUMNS) {
    messages.push(`Use between 1 and ${MAX_COLUMNS} columns.`);
  }

  if (rows.some((row) => row.header.trim() === "")) {
    messages.push("Every column needs a header.");
    rows
      .filter((row) => row.header.trim() === "")
      .forEach((row) => invalidRowKeys.add(row.key));
  }

  const headerCounts = new Map<string, number>();
  rows.forEach((row) => {
    const header = normalizeHeader(row.header);
    if (header !== "") {
      headerCounts.set(header, (headerCounts.get(header) ?? 0) + 1);
    }
  });
  const duplicated = rows.filter(
    (row) =>
      (headerCounts.get(normalizeHeader(row.header)) ?? 0) > 1 &&
      row.header.trim() !== "",
  );
  if (duplicated.length > 0) {
    messages.push("Column headers must be unique.");
    duplicated.forEach((row) => invalidRowKeys.add(row.key));
  }

  const mapped = rows.filter((row) => row.targetField !== MappableField.Ignore);
  const countOf = (field: MappableField) =>
    mapped.filter((row) => row.targetField === field).length;

  if (countOf(MappableField.Amount) === 0) {
    messages.push("Map a column to Amount.");
  }
  if (countOf(MappableField.Date) === 0) {
    messages.push("Map a column to Date.");
  }
  const hasDuplicateField = Object.values(MappableField).some(
    (field) => field !== MappableField.Ignore && countOf(field) > 1,
  );
  if (hasDuplicateField) {
    messages.push("Each field can be mapped to only one column.");
  }

  if (messages.length === 0) {
    return null;
  }

  return {
    messages,
    nameInvalid,
    invalidRowKeys: [...invalidRowKeys],
  };
};

export const rowsFrom = (mapping?: ImportMapping): MappingRow[] => {
  if (mapping) {
    return mapping.columns.map((column) => ({
      key: crypto.randomUUID(),
      header: column.header,
      targetField: column.targetField,
    }));
  }

  return [
    { key: crypto.randomUUID(), header: "", targetField: MappableField.Date },
    { key: crypto.randomUUID(), header: "", targetField: MappableField.Amount },
  ];
};
