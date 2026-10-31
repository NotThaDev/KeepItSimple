const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export function formatRelativeTime(date: Date, now = new Date()): string {
  const diff = now.getTime() - date.getTime();
  if (diff < MINUTE_MS) return "Just now";
  if (diff < HOUR_MS) return `${Math.floor(diff / MINUTE_MS)} min ago`;
  if (diff < DAY_MS) return `${Math.floor(diff / HOUR_MS)} h ago`;
  if (diff < 2 * DAY_MS) return "Yesterday";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
