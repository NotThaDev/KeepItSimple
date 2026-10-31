import {
  ReminderFrequency,
  WEEKDAYS,
  type ImportReminderSetting,
} from "@/lib/models/Notification";

export const FREQUENCY_OPTIONS = Object.values(ReminderFrequency).map((frequency) => ({
  value: frequency,
  label: frequency,
}));

export const WEEKDAY_OPTIONS = WEEKDAYS.map((day) => ({ value: day, label: day }));

// Up to the 28th, so the reminder fires in every month, February included.
export const DAY_OF_MONTH_OPTIONS = Array.from({ length: 28 }, (_, index) => ({
  value: String(index + 1),
  label: String(index + 1),
}));

export function browserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function defaultImportReminder(): ImportReminderSetting {
  return {
    enabled: false,
    frequency: ReminderFrequency.Daily,
    dayOfWeek: null,
    dayOfMonth: null,
    timeOfDay: "09:00",
    timeZone: browserTimeZone(),
    sendEmail: false,
    message: null,
  };
}

export function isSameSetting(a: ImportReminderSetting, b: ImportReminderSetting): boolean {
  return (
    a.enabled === b.enabled &&
    a.frequency === b.frequency &&
    a.dayOfWeek === b.dayOfWeek &&
    a.dayOfMonth === b.dayOfMonth &&
    a.timeOfDay === b.timeOfDay &&
    a.timeZone === b.timeZone &&
    a.sendEmail === b.sendEmail &&
    a.message === b.message
  );
}
