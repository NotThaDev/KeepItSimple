import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CategoryRuleCondition,
  CategoryRuleGroup,
} from "@/lib/models/CategoryRule";
import { Pocket } from "@/lib/models/Pocket";
import { cn } from "cn";
import { FIELD_SHORT_LABELS, OPERATOR_SHORT_LABELS } from "../ruleLabels";
import { LogicBadge, TokenBadge } from "./LogicBadge";
import {
  BadgeKind,
  conditionValue,
  connectorLogic,
  formatDisplayValue,
} from "./utils";

interface GroupTextLineProps {
  group: CategoryRuleGroup;
  pockets: Pocket[];
  parenthesize?: boolean;
}

export function GroupTextLine({
  group,
  pockets,
  parenthesize,
}: Readonly<GroupTextLineProps>) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1">
      {parenthesize ? (
        <span className="shrink-0 text-[11px] text-muted-foreground/70">(</span>
      ) : null}
      {group.conditions.map((condition, index) => (
        <span key={index} className="inline-flex min-w-0 items-center gap-1">
          {index > 0 ? (
            <LogicBadge logic={connectorLogic(group, index)} compact={true} />
          ) : null}
          <ConditionBadges
            condition={condition}
            pockets={pockets}
            compact={true}
          />
        </span>
      ))}
      {parenthesize ? (
        <span className="shrink-0 text-[11px] text-muted-foreground/70">)</span>
      ) : null}
    </span>
  );
}

function ValueBadge({
  condition,
  pockets,
  compact,
}: Readonly<{
  condition: CategoryRuleCondition;
  pockets: Pocket[];
  compact?: boolean;
}>) {
  const value = conditionValue(condition, pockets);
  const display = formatDisplayValue(condition, pockets);

  if (!compact) {
    return (
      <TokenBadge
        kind={BadgeKind.Token}
        className="h-auto max-w-full min-w-0 whitespace-normal py-0.5 text-left"
      >
        <span className="break-words">{display}</span>
      </TokenBadge>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex min-w-0 max-w-[7rem]">
          <TokenBadge
            kind={BadgeKind.Token}
            compact
            className="min-w-0 max-w-full shrink-0 justify-start"
          >
            <span className="min-w-0 truncate">{display}</span>
          </TokenBadge>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-sm break-words">
        {value || "—"}
      </TooltipContent>
    </Tooltip>
  );
}

function ConditionBadges({
  condition,
  pockets,
  compact,
}: Readonly<{
  condition: CategoryRuleCondition;
  pockets: Pocket[];
  compact?: boolean;
}>) {
  return (
    <span
      className={cn(
        "inline-flex min-w-0 items-center gap-0.5",
        !compact && "w-full flex-wrap",
      )}
    >
      <TokenBadge kind={BadgeKind.Token} compact={compact}>
        {FIELD_SHORT_LABELS[condition.field]}
      </TokenBadge>
      <TokenBadge kind={BadgeKind.Operator} compact={compact}>
        {OPERATOR_SHORT_LABELS[condition.operator]}
      </TokenBadge>
      <ValueBadge condition={condition} pockets={pockets} compact={compact} />
    </span>
  );
}
