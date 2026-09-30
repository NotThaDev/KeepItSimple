"use client";

import { TransactionCategorySelector } from "@/app/transactions/TransactionCategorySelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CategoryRuleCondition,
  OPERATORS_BY_FIELD,
  RuleField,
} from "@/lib/models/CategoryRule";
import { Pocket } from "@/lib/models/Pocket";
import {
  isTransactionCategory,
  TransactionCategory,
} from "@/lib/models/Transaction";
import { Trash2 } from "lucide-react";
import { FieldSelect } from "./selectors/FieldSelect";
import { OperatorSelect } from "./selectors/OperatorSelect";
import { PocketSelect } from "./selectors/PocketSelect";

interface ConditionRowProps {
  condition: CategoryRuleCondition;
  canRemove: boolean;
  pockets: Pocket[];
  invalidValue?: boolean;
  onChange: (condition: CategoryRuleCondition) => void;
  onRemove: () => void;
}

export function ConditionRow({
  condition,
  canRemove,
  pockets,
  invalidValue,
  onChange,
  onRemove,
}: Readonly<ConditionRowProps>) {
  const handleFieldChange = (field: RuleField) => {
    onChange({
      field,
      operator: OPERATORS_BY_FIELD[field][0],
      value: "",
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FieldSelect value={condition.field} onChange={handleFieldChange} />
      <OperatorSelect
        field={condition.field}
        value={condition.operator}
        onChange={(operator) => onChange({ ...condition, operator })}
      />
      {condition.field === RuleField.Category ? (
        <TransactionCategorySelector
          showAll
          value={
            isTransactionCategory(condition.value)
              ? condition.value
              : TransactionCategory.Other
          }
          onChange={(value) => onChange({ ...condition, value })}
          isInvalid={invalidValue}
          className="min-w-0 flex-1"
        />
      ) : condition.field === RuleField.Pocket ? (
        <PocketSelect
          value={condition.value}
          pockets={pockets}
          onChange={(value) => onChange({ ...condition, value })}
          invalid={invalidValue}
        />
      ) : (
        <Input
          className="min-w-0 flex-1"
          type={condition.field === RuleField.Amount ? "number" : "text"}
          step={condition.field === RuleField.Amount ? "0.01" : undefined}
          placeholder={
            condition.field === RuleField.Amount ? "0.00" : "string to compare"
          }
          value={condition.value}
          aria-invalid={invalidValue}
          onChange={(event) =>
            onChange({ ...condition, value: event.target.value })
          }
        />
      )}
      {canRemove ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          aria-label="Remove condition"
        >
          <Trash2 />
        </Button>
      ) : null}
    </div>
  );
}
