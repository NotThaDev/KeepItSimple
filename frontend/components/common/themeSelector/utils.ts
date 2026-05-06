import { Sun, Moon, MonitorCog, LucideIcon } from "lucide-react";

export enum ThemeKind {
  LIGHT = "light",
  DARK = "dark",
  SYSTEM = "system",
}

export const THEME_ICON_MAP: Record<ThemeKind, LucideIcon> = {
  [ThemeKind.LIGHT]: Sun,
  [ThemeKind.DARK]: Moon,
  [ThemeKind.SYSTEM]: MonitorCog,
};
