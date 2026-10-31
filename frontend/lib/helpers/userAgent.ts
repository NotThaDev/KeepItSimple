const BROWSERS: [RegExp, string][] = [
  [/Edg\//, "Edge"],
  [/OPR\/|Opera/, "Opera"],
  [/Firefox\/|FxiOS/, "Firefox"],
  [/Chrome\/|CriOS/, "Chrome"],
  [/Safari\//, "Safari"],
];

const SYSTEMS: [RegExp, string][] = [
  [/iPhone|iPad|iPod/, "iOS"],
  [/Android/, "Android"],
  [/Windows/, "Windows"],
  [/Mac OS X|Macintosh/, "macOS"],
  [/Linux/, "Linux"],
];

const match = (ua: string, table: [RegExp, string][]) =>
  table.find(([pattern]) => pattern.test(ua))?.[1];

// Order matters: Edge and Opera also say "Chrome", Chrome also says "Safari", iOS also says "Mac OS X".
export function describeUserAgent(ua: string | null): string {
  if (!ua) {
    return "Unknown device";
  }
  const browser = match(ua, BROWSERS);
  const system = match(ua, SYSTEMS);
  if (browser && system) {
    return `${browser} on ${system}`;
  }
  return browser ?? system ?? "Unknown device";
}

export function isMobileUserAgent(ua: string | null): boolean {
  return Boolean(ua && /Mobi|Android|iPhone|iPad|iPod/.test(ua));
}
