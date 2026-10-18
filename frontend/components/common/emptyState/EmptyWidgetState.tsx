import type { ComponentType } from "react";
import { BanknoteX } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyWidgetStateProps {
  title: string;
  description: string;
  icon?: ComponentType<{ className?: string }>;
  className?: string;
}

export function EmptyWidgetState({ title, description, icon: Icon = BanknoteX, className }: Readonly<EmptyWidgetStateProps>) {
  return (
    <div className={cn("flex h-full w-full flex-1 items-center justify-center", className)}>
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-dashed bg-muted/30 px-6 py-8 text-center shadow-sm">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/15">
          <Icon className="size-6" />
        </div>
        <div className="space-y-1.5">
          <p className="text-base font-semibold">{title}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}
