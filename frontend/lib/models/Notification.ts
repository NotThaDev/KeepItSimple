import { FetchWrapperResponse, get, post, put } from "@/lib/fetchWrapper";

export enum ReminderFrequency {
  Daily = "Daily",
  Weekly = "Weekly",
  Monthly = "Monthly",
}

export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export const REMINDER_MESSAGE_MAX_LENGTH = 500;

// timeOfDay is "HH:mm" in the UI; the API uses "HH:mm:ss".
export interface ImportReminderSetting {
  enabled: boolean;
  frequency: ReminderFrequency;
  dayOfWeek: Weekday | null;
  dayOfMonth: number | null;
  timeOfDay: string;
  timeZone: string;
  sendEmail: boolean;
  message: string | null;
}

export interface InAppNotification {
  id: number;
  title: string;
  body: string;
  createdAt: Date;
  readAt: Date | null;
}

export interface UnreadSummary {
  count: number;
  latestId: number | null;
}

interface ImportReminderDto extends Omit<ImportReminderSetting, "timeOfDay"> {
  timeOfDay: string;
}

interface InAppNotificationDto extends Omit<InAppNotification, "createdAt" | "readAt"> {
  createdAt: string;
  readAt: string | null;
}

const IMPORT_REMINDER_PATH = "/api/notifications/settings/import-reminder";

function toImportReminderSetting(dto: ImportReminderDto): ImportReminderSetting {
  return { ...dto, timeOfDay: dto.timeOfDay.slice(0, 5) };
}

function toImportReminderDto(setting: ImportReminderSetting): ImportReminderDto {
  return { ...setting, timeOfDay: `${setting.timeOfDay}:00` };
}

function toInAppNotification(dto: InAppNotificationDto): InAppNotification {
  return {
    ...dto,
    createdAt: new Date(dto.createdAt),
    readAt: dto.readAt ? new Date(dto.readAt) : null,
  };
}

export async function getImportReminder(): Promise<FetchWrapperResponse<ImportReminderSetting>> {
  const response = await get<ImportReminderDto>(IMPORT_REMINDER_PATH);
  return { ...response, data: response.data && toImportReminderSetting(response.data) };
}

export async function saveImportReminder(
  setting: ImportReminderSetting,
): Promise<FetchWrapperResponse<ImportReminderSetting>> {
  const response = await put<ImportReminderDto>(
    IMPORT_REMINDER_PATH,
    toImportReminderDto(setting),
  );
  return { ...response, data: response.data && toImportReminderSetting(response.data) };
}

export async function getNotifications(
  read: boolean,
): Promise<FetchWrapperResponse<InAppNotification[]>> {
  const response = await get<InAppNotificationDto[]>(`/api/notifications?read=${read}`);
  return { ...response, data: response.data?.map(toInAppNotification) };
}

export async function getUnreadSummary(): Promise<FetchWrapperResponse<UnreadSummary>> {
  return await get<UnreadSummary>("/api/notifications/unread-summary");
}

export async function markNotificationRead(id: number): Promise<FetchWrapperResponse<void>> {
  return await post<void>(`/api/notifications/${id}/read`, undefined);
}
