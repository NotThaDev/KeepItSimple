"use client";

import { cn } from "@/lib/utils";
import { CATEGORY_ICONS } from "./iconRegistry";

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

// "PawPrint" → "Paw Print", "Gamepad2" → "Gamepad" (Lucide variant digits mean nothing to a reader).
const toLabel = (key: string) =>
  key.replace(/\d+$/, "").replace(/([a-z])([A-Z])/g, "$1 $2");

export function IconPicker({ value, onChange }: Readonly<IconPickerProps>) {
  return (
    <div
      role="radiogroup"
      aria-label="Icon"
      className="grid grid-cols-6 gap-2 sm:grid-cols-8"
    >
      {Object.entries(CATEGORY_ICONS).map(([key, Icon]) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={value === key}
          aria-label={toLabel(key)}
          title={toLabel(key)}
          onClick={() => onChange(key)}
          className={cn(
            "flex size-9 items-center justify-center rounded-md border text-muted-foreground hover:bg-accent",
            value === key &&
              "border-primary bg-accent text-foreground ring-2 ring-primary",
          )}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  );
}
