import {
  RuleField,
  RuleLogic,
  RuleOperator,
} from "@/lib/models/CategoryRule";

export const FIELD_LABELS: Record<RuleField, string> = {
  [RuleField.Description]: "Description",
  [RuleField.Amount]: "Amount",
  [RuleField.Category]: "Category",
  [RuleField.Pocket]: "Pocket",
};

export const OPERATOR_LABELS: Record<RuleOperator, string> = {
  [RuleOperator.Contains]: "contains",
  [RuleOperator.Equals]: "equals",
  [RuleOperator.Gt]: "greater than",
  [RuleOperator.Gte]: "greater or equal",
  [RuleOperator.Lt]: "less than",
  [RuleOperator.Lte]: "less or equal",
  [RuleOperator.Eq]: "equals",
  [RuleOperator.NotEquals]: "is not",
};

export const FIELD_SHORT_LABELS: Record<RuleField, string> = {
  [RuleField.Description]: "description",
  [RuleField.Amount]: "amount",
  [RuleField.Category]: "category",
  [RuleField.Pocket]: "pocket",
};

export const OPERATOR_SHORT_LABELS: Record<RuleOperator, string> = {
  [RuleOperator.Contains]: "contains",
  [RuleOperator.Equals]: "=",
  [RuleOperator.Eq]: "=",
  [RuleOperator.NotEquals]: "≠",
  [RuleOperator.Gt]: ">",
  [RuleOperator.Gte]: "≥",
  [RuleOperator.Lt]: "<",
  [RuleOperator.Lte]: "≤",
};

export const LOGIC_LABELS: Record<RuleLogic, string> = {
  [RuleLogic.And]: "AND",
  [RuleLogic.Or]: "OR",
};
