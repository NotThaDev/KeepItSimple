"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ColorPickerProps {
  value: string;
  colors: string[];
  onChange: (color: string) => void;
}

export function ColorPicker({
  value,
  colors,
  onChange,
}: Readonly<ColorPickerProps>) {
  return (
    <div role="radiogroup" aria-label="Color" className="flex flex-wrap gap-2">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={value === color}
          aria-label={color}
          onClick={() => onChange(color)}
          style={{ backgroundColor: color }}
          className={cn(
            "flex size-7 items-center justify-center rounded-full text-white ring-offset-background",
            value === color && "ring-2 ring-offset-2 ring-primary",
          )}
        >
          {value === color ? <Check className="size-4" /> : null}
        </button>
      ))}
    </div>
  );
}
