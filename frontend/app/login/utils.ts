// Unicode classes match Identity's char.IsLower/IsUpper/IsDigit/IsLetterOrDigit.
// shortcut: mirrors Identity:Password in the API appsettings by hand; serve it from an endpoint if the rules start to differ per environment.
export const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One lowercase letter", test: (p: string) => /\p{Ll}/u.test(p) },
  { label: "One uppercase letter", test: (p: string) => /\p{Lu}/u.test(p) },
  { label: "One number", test: (p: string) => /\p{Nd}/u.test(p) },
  { label: "One symbol", test: (p: string) => /[^\p{L}\p{Nd}]/u.test(p) },
];

// Loose on purpose: the server has the final say, this only catches typos like a missing @ or domain.
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function meetsPasswordRules(password: string) {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}

// 905 -> "15:05"
export function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}
