import { ENGLISH_DATE_FORMATTER } from "@/components/common/DateUtils";

export const IMPORT_TABLE_PAGE_SIZE = 5;

export function formatDraftDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return ENGLISH_DATE_FORMATTER.format(date);
}
