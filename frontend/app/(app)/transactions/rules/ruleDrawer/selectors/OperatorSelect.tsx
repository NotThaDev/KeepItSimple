import {
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  Select,
} from "@/components/ui/select";
import {
  RuleField,
  RuleOperator,
  OPERATORS_BY_FIELD,
} from "@/lib/models/CategoryRule";
import { OPERATOR_LABELS } from "../../ruleLabels";

interface OperatorSelectProps {
  field: RuleField;
  value: RuleOperator;
  onChange: (operator: RuleOperator) => void;
}

export function OperatorSelect({
  field,
  value,
  onChange,
}: Readonly<OperatorSelectProps>) {
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
