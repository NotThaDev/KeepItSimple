import {
  CategoryRuleCondition,
  CategoryRuleGroup,
  resolveConditionCategory,
  RuleField,
  RuleLogic,
  RuleOperator,
} from "@/lib/models/CategoryRule";
import { FIELD_LABELS } from "../ruleLabels";
import { Pocket } from "@/lib/models/Pocket";
import type { Category } from "@/lib/models/Category";

export enum BadgeKind {
  Token = "token",
  Operator = "op",
  And = "and",
  Or = "or",
}

export function conditionLead(condition: CategoryRuleCondition) {
  const field = FIELD_LABELS[condition.field];

  switch (condition.operator) {
    case RuleOperator.Contains:
      return `${field} contains`;
    case RuleOperator.Equals:
      return condition.field === RuleField.Amount
        ? `${field} equals`
        : `${field} is`;
    case RuleOperator.Eq:
      return `${field} equals`;
    case RuleOperator.NotEquals:
      return `${field} is not`;
    case RuleOperator.Gt:
      return `${field} is greater than`;
    case RuleOperator.Gte:
      return `${field} is at least`;
    case RuleOperator.Lt:
      return `${field} is less than`;
    case RuleOperator.Lte:
      return `${field} is at most`;
    default:
      return field;
  }
}

export function conditionValue(
  condition: CategoryRuleCondition,
  pockets: Pocket[],
  categories: Category[],
) {
  if (condition.field === RuleField.Category) {
    return (
      resolveConditionCategory(condition.value, categories)?.name ??
      condition.value
    );
  }

  if (condition.field === RuleField.Pocket) {
    return (
      pockets.find((pocket) => String(pocket.id) === condition.value)?.name ??
      condition.value
    );
  }

  return condition.value;
}

export function formatDisplayValue(
  condition: CategoryRuleCondition,
  pockets: Pocket[],
  categories: Category[],
) {
  const value = conditionValue(condition, pockets, categories);
  if (condition.field === RuleField.Description) {
    return `"${value}"`;
  }

  return value || "—";
}

export function connectorLogic(
  group: CategoryRuleGroup,
  index: number,
): RuleLogic {
  return group.conditions[index]?.logic ?? RuleLogic.And;
}
