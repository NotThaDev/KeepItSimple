import { isNullOrUndefined } from "@/lib/helpers/util";
import { CategoryRule, CategoryRuleGroup } from "@/lib/models/CategoryRule";
import { cloneRule, duplicateRule, createEmptyRule } from "../utils";

export interface RuleConditionError {
  groupIndex: number;
  conditionIndex: number;
}

export interface RuleValidation {
  nameInvalid: boolean;
  conditions: RuleConditionError[];
}

function isEmpty(value: string | null | undefined) {
  return isNullOrUndefined(value) || value.trim().length === 0;
}

export function validateRule(rule: CategoryRule): RuleValidation | null {
  const nameInvalid = rule.name.trim().length === 0;
  const conditions: RuleConditionError[] = [];

  rule.groups.forEach((group, groupIndex) => {
    group.conditions.forEach((condition, conditionIndex) => {
      if (isEmpty(condition.value)) {
        conditions.push({ groupIndex, conditionIndex });
      }
    });
  });

  if (!nameInvalid && conditions.length === 0) {
    return null;
  }

  return { nameInvalid, conditions };
}

export function hasConditionError(
  errors: RuleConditionError[] | undefined,
  groupIndex: number,
  conditionIndex: number,
) {
  return (
    errors?.some(
      (error) =>
        error.groupIndex === groupIndex &&
        error.conditionIndex === conditionIndex,
    ) ?? false
  );
}

export function draftFrom(
  rule?: CategoryRule,
  copyFrom?: CategoryRule,
): CategoryRule {
  if (rule) {
    return cloneRule(rule);
  }

  if (copyFrom) {
    return duplicateRule(copyFrom);
  }

  return createEmptyRule();
}

export function updateGroup(
  groups: CategoryRuleGroup[],
  index: number,
  patch: Partial<CategoryRuleGroup>,
): CategoryRuleGroup[] {
  return groups.map((group, groupIndex) =>
    groupIndex === index ? { ...group, ...patch } : group,
  );
}
