import { cn } from "@/lib/utils";

interface DividerProps {
  className?: string;
}

export function Divider({ className }: Readonly<DividerProps>) {
  return (
    <div
      aria-hidden="true"
      className={cn("h-px w-full bg-border/70", className)}
    />
  );
}
