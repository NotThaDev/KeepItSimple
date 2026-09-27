import type { RuleField, RuleLogic, RuleOperator } from "@/lib/models/CategoryRule";

export const FIELD_LABELS: Record<RuleField, string> = {
  Description: "Description",
  Amount: "Amount",
  Category: "Category",
  Pocket: "Pocket",
};

export const OPERATOR_LABELS: Record<RuleOperator, string> = {
  Contains: "contains",
  Equals: "equals",
  Gt: "greater than",
  Gte: "greater or equal",
  Lt: "less than",
  Lte: "less or equal",
  Eq: "equals",
  NotEquals: "is not",
};

export const FIELD_SHORT_LABELS: Record<RuleField, string> = {
  Description: "description",
  Amount: "amount",
  Category: "category",
  Pocket: "pocket",
};

export const OPERATOR_SHORT_LABELS: Record<RuleOperator, string> = {
  Contains: "contains",
  Equals: "=",
  Eq: "=",
  NotEquals: "≠",
  Gt: ">",
  Gte: "≥",
  Lt: "<",
  Lte: "≤",
};

export const LOGIC_LABELS: Record<RuleLogic, string> = {
  And: "AND",
  Or: "OR",
};
