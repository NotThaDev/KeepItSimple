"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CategoryRuleCondition,
  CategoryRuleGroup,
  CategoryRulePayload,
  createEmptyCondition,
  createEmptyGroup,
} from "@/lib/models/CategoryRule";
import { Pocket } from "@/lib/models/Pocket";
import { Plus, Trash2 } from "lucide-react";
import { ConditionRow } from "./ConditionRow";
import { LOGIC_LABELS } from "../ruleLabels";
import { LogicToggle } from "./LogicToggle";
import { hasConditionError, RuleConditionError } from "./utils";

function updateGroup(
  groups: CategoryRuleGroup[],
  index: number,
  patch: Partial<CategoryRuleGroup>,
): CategoryRuleGroup[] {
  return groups.map((group, groupIndex) =>
    groupIndex === index ? { ...group, ...patch } : group,
  );
}

interface RuleBuilderProps {
  rule: CategoryRulePayload;
  pockets: Pocket[];
  errors?: RuleConditionError[];
  onChange: (rule: CategoryRulePayload) => void;
}

export function RuleBuilder({
  rule,
  pockets,
  errors,
  onChange,
}: Readonly<RuleBuilderProps>) {
  const setGroups = (groups: CategoryRuleGroup[]) =>
    onChange({ ...rule, groups });

  const setCondition = (
    groupIndex: number,
    conditionIndex: number,
    next: CategoryRuleCondition,
  ) => {
    const group = rule.groups[groupIndex];
    const conditions = group.conditions.map((item, index) =>
      index === conditionIndex ? next : item,
    );
    setGroups(updateGroup(rule.groups, groupIndex, { conditions }));
  };

  const addCondition = (groupIndex: number) => {
    const group = rule.groups[groupIndex];
    const next = createEmptyCondition();
    if (group.conditions.length > 0) {
      next.logic = "And";
    }
    setGroups(
      updateGroup(rule.groups, groupIndex, {
        conditions: [...group.conditions, next],
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

    const [first, ...rest] = conditions;
    setGroups(
      updateGroup(rule.groups, groupIndex, {
        conditions: [{ ...first, logic: undefined }, ...rest],
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
              {group.conditions.map((condition, conditionIndex) => (
                <div key={conditionIndex} className="flex flex-col gap-2">
                  {conditionIndex > 0 ? (
                    <LogicToggle
                      value={condition.logic ?? "And"}
                      onChange={(logic) =>
                        setCondition(groupIndex, conditionIndex, {
                          ...condition,
                          logic,
                        })
                      }
                      ariaLabel={`How condition ${conditionIndex + 1} combines in group ${groupIndex + 1}`}
                    />
                  ) : null}
                  <ConditionRow
                    condition={condition}
                    canRemove={group.conditions.length > 1}
                    pockets={pockets}
                    invalidValue={hasConditionError(
                      errors,
                      groupIndex,
                      conditionIndex,
                    )}
                    onChange={(next) =>
                      setCondition(groupIndex, conditionIndex, {
                        ...next,
                        logic: condition.logic,
                      })
                    }
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
