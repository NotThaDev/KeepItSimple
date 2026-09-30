import { RuleLogic } from "@/lib/models/CategoryRule";
import { LOGIC_LABELS } from "../ruleLabels";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface LogicToggleProps {
  value: RuleLogic;
  onChange: (logic: RuleLogic) => void;
  ariaLabel: string;
}

export function LogicToggle({
  value,
  onChange,
  ariaLabel,
}: Readonly<LogicToggleProps>) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      value={value}
      onValueChange={(next) => {
        if (next === RuleLogic.And || next === RuleLogic.Or) {
          onChange(next);
        }
      }}
      aria-label={ariaLabel}
    >
      <ToggleGroupItem value={RuleLogic.And}>
        {LOGIC_LABELS[RuleLogic.And]}
      </ToggleGroupItem>
      <ToggleGroupItem value={RuleLogic.Or}>
        {LOGIC_LABELS[RuleLogic.Or]}
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
