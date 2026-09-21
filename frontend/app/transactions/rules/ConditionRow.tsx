"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CategoryRuleCondition,
  OPERATORS_BY_FIELD,
  RuleField,
  RuleOperator,
} from "@/lib/models/CategoryRule";
import { Pocket } from "@/lib/models/Pocket";
import {
  ALL_TRANSACTION_CATEGORIES,
  formatCategoryLabel,
  TransactionCategory,
} from "@/lib/models/Transaction";
import { Trash2 } from "lucide-react";
import { FIELD_LABELS, OPERATOR_LABELS } from "./ruleLabels";

interface ConditionRowProps {
  condition: CategoryRuleCondition;
  canRemove: boolean;
  pockets: Pocket[];
  onChange: (condition: CategoryRuleCondition) => void;
  onRemove: () => void;
}

function FieldSelect({
  value,
  onChange,
}: {
  value: RuleField;
  onChange: (field: RuleField) => void;
}) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as RuleField)}>
      <SelectTrigger className="w-[140px] shrink-0">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {(Object.keys(FIELD_LABELS) as RuleField[]).map((field) => (
            <SelectItem key={field} value={field}>
              {FIELD_LABELS[field]}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function OperatorSelect({
  field,
  value,
  onChange,
}: {
  field: RuleField;
  value: RuleOperator;
  onChange: (operator: RuleOperator) => void;
}) {
  return (
    <Select
      value={value}
      onValueChange={(next) => onChange(next as RuleOperator)}
    >
      <SelectTrigger className="w-[160px] shrink-0">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {OPERATORS_BY_FIELD[field].map((operator) => (
            <SelectItem key={operator} value={operator}>
              {OPERATOR_LABELS[operator]}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function CategoryValueSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select
      value={value || undefined}
      onValueChange={onChange}
    >
      <SelectTrigger className="min-w-0 flex-1">
        <SelectValue placeholder="Category" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {ALL_TRANSACTION_CATEGORIES.map((category) => (
            <SelectItem key={category} value={category}>
              {formatCategoryLabel(category)}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function PocketValueSelect({
  value,
  pockets,
  onChange,
}: {
  value: string;
  pockets: Pocket[];
  onChange: (value: string) => void;
}) {
  return (
    <Select
      value={value || undefined}
      onValueChange={onChange}
    >
      <SelectTrigger className="min-w-0 flex-1">
        <SelectValue placeholder="Pocket" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {pockets.map((pocket) => (
            <SelectItem key={pocket.id} value={String(pocket.id)}>
              {pocket.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export function ConditionRow({
  condition,
  canRemove,
  pockets,
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
      {condition.field === "Category" ? (
        <CategoryValueSelect
          value={condition.value}
          onChange={(value) => onChange({ ...condition, value })}
        />
      ) : condition.field === "Pocket" ? (
        <PocketValueSelect
          value={condition.value}
          pockets={pockets}
          onChange={(value) => onChange({ ...condition, value })}
        />
      ) : (
        <Input
          className="min-w-0 flex-1"
          type={condition.field === "Amount" ? "number" : "text"}
          step={condition.field === "Amount" ? "0.01" : undefined}
          placeholder={
            condition.field === "Amount" ? "0.00" : "string to compare"
          }
          value={condition.value}
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

export function TargetCategorySelect({
  value,
  onChange,
}: {
  value: TransactionCategory;
  onChange: (category: TransactionCategory) => void;
}) {
  return (
    <Select
      value={value}
      onValueChange={(next) => onChange(next as TransactionCategory)}
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {ALL_TRANSACTION_CATEGORIES.map((category) => (
            <SelectItem key={category} value={category}>
              {formatCategoryLabel(category)}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
