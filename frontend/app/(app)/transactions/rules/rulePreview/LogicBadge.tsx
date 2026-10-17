import { RuleLogic } from "@/lib/models/CategoryRule";
import { LOGIC_LABELS } from "../ruleLabels";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { ReactNode } from "react";
import { BadgeKind } from "./utils";

export function LogicBadge({
  logic,
  compact,
}: Readonly<{
  logic: RuleLogic;
  compact?: boolean;
}>) {
  return (
    <TokenBadge
      kind={logic === RuleLogic.And ? BadgeKind.And : BadgeKind.Or}
      compact={compact}
    >
      {LOGIC_LABELS[logic]}
    </TokenBadge>
  );
}

export function TokenBadge({
  children,
  kind,
  compact,
  className,
}: Readonly<{
  children: ReactNode;
  kind: BadgeKind;
  compact?: boolean;
  className?: string;
}>) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "rounded-md font-normal",
        compact ? "h-4 px-1 text-[10px]" : "h-5 px-1.5 text-[11px]",
        kind === BadgeKind.Token && "bg-muted text-muted-foreground",
        kind === BadgeKind.Operator && "font-semibold bg-primary/15 text-primary",
        kind === BadgeKind.And &&
          "font-semibold bg-sky-500/15 text-sky-700 dark:text-sky-300",
        kind === BadgeKind.Or &&
          "font-semibold bg-amber-500/15 text-amber-800 dark:text-amber-300",
        className,
      )}
    >
      {children}
    </Badge>
  );
}
