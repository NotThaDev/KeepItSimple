import { cn } from "@/lib/utils";

const VARIANT_CLASSES = {
  avatar:
    "absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-background tabular-nums",
  menu: "ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-semibold leading-none text-white tabular-nums",
} as const;

interface UnreadBadgeProps {
  count: number;
  variant: keyof typeof VARIANT_CLASSES;
  className?: string;
}

export function UnreadBadge({
  count,
  variant,
  className,
}: Readonly<UnreadBadgeProps>) {
  if (count <= 0) return null;

  return (
    <span aria-hidden="true" className={cn(VARIANT_CLASSES[variant], className)}>
      {count > 99 ? "99+" : count}
    </span>
  );
}
