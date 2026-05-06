"use client";

import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useMemo } from "react";
import { THEME_ICON_MAP, ThemeKind } from "./utils";

export function ThemeButton() {
  const { theme, setTheme } = useTheme();

  const icon = useMemo(() => {
    const IconComponent =
      THEME_ICON_MAP[(theme as ThemeKind) ?? ThemeKind.DARK];
    return <IconComponent />;
  }, [theme]);

  const onThemeChange = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (theme === ThemeKind.LIGHT) {
      setTheme(ThemeKind.DARK);
    } else {
      setTheme(ThemeKind.LIGHT);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Submit"
      onClick={onThemeChange}
    >
      {icon}
    </Button>
  );
}
