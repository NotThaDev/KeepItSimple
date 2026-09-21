"use client";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CategoryRule,
  CategoryRuleCondition,
  CategoryRuleGroup,
  RuleLogic,
} from "@/lib/models/CategoryRule";
import { Pocket } from "@/lib/models/Pocket";
import {
  formatCategoryLabel,
  isTransactionCategory,
} from "@/lib/models/Transaction";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import {
  FIELD_SHORT_LABELS,
  LOGIC_LABELS,
  OPERATOR_SHORT_LABELS,
} from "./ruleLabels";

function TokenBadge({
  children,
  kind,
  compact,
  className,
}: Readonly<{
  children: ReactNode;
  kind: "token" | "op" | "and" | "or";
  compact?: boolean;
  className?: string;
}>) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "rounded-md font-normal",
        compact ? "h-4 px-1 text-[10px]" : "h-5 px-1.5 text-[11px]",
        kind === "token" && "bg-muted text-muted-foreground",
        kind === "op" && "font-semibold bg-primary/15 text-primary",
        kind === "and" &&
          "font-semibold bg-sky-500/15 text-sky-700 dark:text-sky-300",
        kind === "or" &&
          "font-semibold bg-amber-500/15 text-amber-800 dark:text-amber-300",
        className,
      )}
    >
      {children}
    </Badge>
  );
}

function LogicBadge({
  logic,
  compact,
}: Readonly<{
  logic: RuleLogic;
  compact?: boolean;
}>) {
  return (
    <TokenBadge kind={logic === "And" ? "and" : "or"} compact={compact}>
      {LOGIC_LABELS[logic]}
    </TokenBadge>
  );
}

function conditionValue(condition: CategoryRuleCondition, pockets: Pocket[]) {
  if (condition.field === "Category" && isTransactionCategory(condition.value)) {
    return formatCategoryLabel(condition.value);
  }

  if (condition.field === "Pocket") {
    return (
      pockets.find((pocket) => String(pocket.id) === condition.value)?.name ??
      condition.value
    );
  }

  return condition.value;
}

function formatDisplayValue(
  condition: CategoryRuleCondition,
  pockets: Pocket[],
) {
  const value = conditionValue(condition, pockets);
  if (condition.field === "Description") {
    return `"${value}"`;
  }

  return value || "—";
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

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex min-w-0",
            compact ? "max-w-[7rem]" : "max-w-[14rem]",
          )}
        >
          <TokenBadge
            kind="token"
            compact={compact}
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
    <span className="inline-flex min-w-0 items-center gap-0.5">
      <TokenBadge kind="token" compact={compact}>
        {FIELD_SHORT_LABELS[condition.field]}
      </TokenBadge>
      <TokenBadge kind="op" compact={compact}>
        {OPERATOR_SHORT_LABELS[condition.operator]}
      </TokenBadge>
      <ValueBadge condition={condition} pockets={pockets} compact={compact} />
    </span>
  );
}

function GroupLine({
  group,
  pockets,
  compact,
  parenthesize,
}: Readonly<{
  group: CategoryRuleGroup;
  pockets: Pocket[];
  compact?: boolean;
  parenthesize?: boolean;
}>) {
  const wrapped = parenthesize ?? group.conditions.length >= 2;

  return (
    <span className="inline-flex min-w-0 items-center gap-1">
      {wrapped ? (
        <span className="shrink-0 text-[11px] text-muted-foreground/70">(</span>
      ) : null}
      {group.conditions.map((condition, index) => (
        <span key={index} className="inline-flex min-w-0 items-center gap-1">
          {index > 0 && group.logic ? (
            <LogicBadge logic={group.logic} compact={compact} />
          ) : null}
          <ConditionBadges
            condition={condition}
            pockets={pockets}
            compact={compact}
          />
        </span>
      ))}
      {wrapped ? (
        <span className="shrink-0 text-[11px] text-muted-foreground/70">)</span>
      ) : null}
    </span>
  );
}

export function RuleSummary({
  rule,
  pockets,
}: Readonly<{
  rule: CategoryRule;
  pockets: Pocket[];
}>) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      {rule.groups.map((group, index) => (
        <div key={index} className="flex min-w-0 flex-col gap-2">
          {index > 0 ? (
            <div className="flex justify-center">
              <LogicBadge logic={rule.groupLogic} />
            </div>
          ) : null}
          <div className="min-w-0 overflow-hidden rounded-lg border border-border/70 bg-muted/20 px-2.5 py-2">
            <GroupLine group={group} pockets={pockets} parenthesize={false} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RuleViewDialog({
  rule,
  pockets,
}: Readonly<{
  rule: CategoryRule;
  pockets: Pocket[];
}>) {
  const showParens = rule.groups.length > 1;

  return (
    <TooltipProvider>
      <Dialog>
        <DialogTrigger asChild>
          <button
            type="button"
            className="flex w-full min-w-0 items-center rounded-md py-0.5 text-left transition-colors hover:bg-muted/60"
          >
            <span className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden whitespace-nowrap">
              {rule.groups.length === 0 ? (
                <span className="text-xs text-muted-foreground">
                  No conditions
                </span>
              ) : (
                rule.groups.map((group, index) => (
                  <span
                    key={index}
                    className="inline-flex shrink-0 items-center gap-1"
                  >
                    {index > 0 ? (
                      <LogicBadge logic={rule.groupLogic} compact />
                    ) : null}
                    <GroupLine
                      group={group}
                      pockets={pockets}
                      compact
                      parenthesize={showParens || group.conditions.length >= 2}
                    />
                  </span>
                ))
              )}
            </span>
          </button>
        </DialogTrigger>
        <DialogContent className="flex max-h-[min(40rem,85vh)] flex-col overflow-hidden sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{rule.name}</DialogTitle>
            <DialogDescription>
              Set category to {formatCategoryLabel(rule.targetCategory)}
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <RuleSummary rule={rule} pockets={pockets} />
          </div>
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
