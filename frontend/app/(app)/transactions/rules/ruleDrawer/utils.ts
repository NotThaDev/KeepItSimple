import { isNullOrUndefined } from "@/lib/helpers/util";
import type { Category } from "@/lib/models/Category";
import {
  CategoryRule,
  CategoryRuleGroup,
  resolveConditionCategory,
  RuleField,
} from "@/lib/models/CategoryRule";
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

// Category conditions saved with an enum name become ids, so saving always writes ids.
function withCategoryIds(
  rule: CategoryRule,
  categories: Category[],
): CategoryRule {
  return {
    ...rule,
    groups: rule.groups.map((group) => ({
      conditions: group.conditions.map((condition) => {
        if (condition.field !== RuleField.Category) return condition;
        const category = resolveConditionCategory(condition.value, categories);
        return category
          ? { ...condition, value: String(category.id) }
          : condition;
      }),
    })),
  };
}

export function draftFrom(
  categories: Category[],
  otherCategoryId: number,
  rule?: CategoryRule,
  copyFrom?: CategoryRule,
): CategoryRule {
  if (rule) {
    return withCategoryIds(cloneRule(rule), categories);
  }

  if (copyFrom) {
    return withCategoryIds(duplicateRule(copyFrom), categories);
  }

  return createEmptyRule(otherCategoryId);
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
