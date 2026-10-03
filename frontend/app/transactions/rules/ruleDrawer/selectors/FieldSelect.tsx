import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RuleField } from "@/lib/models/CategoryRule";
import { FIELD_LABELS } from "../../ruleLabels";

interface FieldSelectProps {
  value: RuleField;
  onChange: (field: RuleField) => void;
}

export function FieldSelect({ value, onChange }: Readonly<FieldSelectProps>) {
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
