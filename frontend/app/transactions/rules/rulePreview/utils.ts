import { CategoryRuleCondition } from "@/lib/models/CategoryRule";
import { FIELD_LABELS } from "../ruleLabels";
import { Pocket } from "@/lib/models/Pocket";
import {
  isTransactionCategory,
  formatCategoryLabel,
} from "@/lib/models/Transaction";

export function conditionLead(condition: CategoryRuleCondition) {
  const field = FIELD_LABELS[condition.field];

  switch (condition.operator) {
    case "Contains":
      return `${field} contains`;
    case "Equals":
      return condition.field === "Amount" ? `${field} equals` : `${field} is`;
    case "Eq":
      return `${field} equals`;
    case "NotEquals":
      return `${field} is not`;
    case "Gt":
      return `${field} is greater than`;
    case "Gte":
      return `${field} is at least`;
    case "Lt":
      return `${field} is less than`;
    case "Lte":
      return `${field} is at most`;
    default:
      return field;
  }
}

export function conditionValue(
  condition: CategoryRuleCondition,
  pockets: Pocket[],
) {
  if (
    condition.field === "Category" &&
    isTransactionCategory(condition.value)
  ) {
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

export function formatDisplayValue(
  condition: CategoryRuleCondition,
  pockets: Pocket[],
) {
  const value = conditionValue(condition, pockets);
  if (condition.field === "Description") {
    return `"${value}"`;
  }

  return value || "—";
}
