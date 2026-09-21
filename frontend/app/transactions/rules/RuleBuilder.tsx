"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  CategoryRuleGroup,
  CategoryRulePayload,
  createEmptyCondition,
  createEmptyGroup,
  RuleLogic,
} from "@/lib/models/CategoryRule";
import { Pocket } from "@/lib/models/Pocket";
import { Plus, Trash2 } from "lucide-react";
import { ConditionRow } from "./ConditionRow";
import { LOGIC_LABELS } from "./ruleLabels";

interface RuleBuilderProps {
  rule: CategoryRulePayload;
  pockets: Pocket[];
  onChange: (rule: CategoryRulePayload) => void;
}

function LogicToggle({
  value,
  onChange,
  ariaLabel,
}: {
  value: RuleLogic;
  onChange: (logic: RuleLogic) => void;
  ariaLabel: string;
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      value={value}
      onValueChange={(next) => {
        if (next === "And" || next === "Or") {
          onChange(next);
        }
      }}
      aria-label={ariaLabel}
    >
      <ToggleGroupItem value="And">{LOGIC_LABELS.And}</ToggleGroupItem>
      <ToggleGroupItem value="Or">{LOGIC_LABELS.Or}</ToggleGroupItem>
    </ToggleGroup>
  );
}

function updateGroup(
  groups: CategoryRuleGroup[],
  index: number,
  patch: Partial<CategoryRuleGroup>,
): CategoryRuleGroup[] {
  return groups.map((group, groupIndex) =>
    groupIndex === index ? { ...group, ...patch } : group,
  );
}

export function RuleBuilder({
  rule,
  pockets,
  onChange,
}: Readonly<RuleBuilderProps>) {
  const setGroups = (groups: CategoryRuleGroup[]) =>
    onChange({ ...rule, groups });

  const addCondition = (groupIndex: number) => {
    const group = rule.groups[groupIndex];
    const conditions = [...group.conditions, createEmptyCondition()];
    setGroups(
      updateGroup(rule.groups, groupIndex, {
        conditions,
        logic: conditions.length >= 2 ? (group.logic ?? "And") : undefined,
      }),
    );
  };

  const removeCondition = (groupIndex: number, conditionIndex: number) => {
    const group = rule.groups[groupIndex];
    const conditions = group.conditions.filter(
      (_, index) => index !== conditionIndex,
    );
    if (conditions.length === 0) {
      return;
    }

    setGroups(
      updateGroup(rule.groups, groupIndex, {
        conditions,
        logic: conditions.length >= 2 ? (group.logic ?? "And") : undefined,
      }),
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-muted-foreground">Match groups with</p>
        <LogicToggle
          value={rule.groupLogic}
          onChange={(groupLogic) => onChange({ ...rule, groupLogic })}
          ariaLabel="How groups combine"
        />
      </div>

      {rule.groups.map((group, groupIndex) => (
        <div key={groupIndex} className="flex flex-col gap-3">
          {groupIndex > 0 ? (
            <p className="text-center text-xs font-semibold tracking-wide text-muted-foreground">
              {LOGIC_LABELS[rule.groupLogic]}
            </p>
          ) : null}

          <Card size="sm" className="border border-border/70">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-sm font-medium">
                Group {groupIndex + 1}
              </CardTitle>
              {rule.groups.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() =>
                    setGroups(
                      rule.groups.filter((_, index) => index !== groupIndex),
                    )
                  }
                  aria-label={`Remove group ${groupIndex + 1}`}
                >
                  <Trash2 />
                </Button>
              ) : null}
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {group.conditions.length >= 2 ? (
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs text-muted-foreground">
                    Conditions in this group
                  </p>
                  <LogicToggle
                    value={group.logic ?? "And"}
                    onChange={(logic) =>
                      setGroups(updateGroup(rule.groups, groupIndex, { logic }))
                    }
                    ariaLabel={`How conditions combine in group ${groupIndex + 1}`}
                  />
                </div>
              ) : null}

              {group.conditions.map((condition, conditionIndex) => (
                <div key={conditionIndex} className="flex flex-col gap-2">
                  {conditionIndex > 0 && group.logic ? (
                    <p className="text-xs font-medium text-muted-foreground">
                      {LOGIC_LABELS[group.logic]}
                    </p>
                  ) : null}
                  <ConditionRow
                    condition={condition}
                    canRemove={group.conditions.length > 1}
                    pockets={pockets}
                    onChange={(next) => {
                      const conditions = group.conditions.map((item, index) =>
                        index === conditionIndex ? next : item,
                      );
                      setGroups(
                        updateGroup(rule.groups, groupIndex, { conditions }),
                      );
                    }}
                    onRemove={() => removeCondition(groupIndex, conditionIndex)}
                  />
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => addCondition(groupIndex)}
              >
                <Plus />
                Add condition
              </Button>
            </CardContent>
          </Card>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() => setGroups([...rule.groups, createEmptyGroup()])}
      >
        <Plus />
        Add group
      </Button>
    </div>
  );
}
