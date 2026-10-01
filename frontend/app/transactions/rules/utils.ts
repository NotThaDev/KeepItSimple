import {
  CategoryRuleGroup,
  CategoryRule,
  RuleLogic,
  normalizeRuleGroups,
  CategoryRuleCondition,
  OPERATORS_BY_FIELD,
  RuleField,
} from "@/lib/models/CategoryRule";
import { TransactionCategory } from "@/lib/models/Transaction";

export function createEmptyGroup(): CategoryRuleGroup {
  return { conditions: [createEmptyCondition()] };
}

export function createEmptyRule(): CategoryRule {
  return {
    name: "",
    enabled: true,
    targetCategory: TransactionCategory.Other,
    groupLogic: RuleLogic.Or,
    groups: [createEmptyGroup()],
  };
}

export function cloneRule(rule: CategoryRule, name = rule.name): CategoryRule {
  return {
    id: rule.id,
    sortOrder: rule.sortOrder,
    name,
    enabled: rule.enabled,
    targetCategory: rule.targetCategory,
    groupLogic: rule.groupLogic,
    groups: normalizeRuleGroups(rule.groups),
  };
}

export function duplicateRule(rule: CategoryRule): CategoryRule {
  return {
    ...cloneRule(rule, `${rule.name} (copy)`),
  };
}

export function createEmptyCondition(
  field: RuleField = RuleField.Description,
): CategoryRuleCondition {
  return {
    field,
    operator: OPERATORS_BY_FIELD[field][0],
    value: "",
  };
}
