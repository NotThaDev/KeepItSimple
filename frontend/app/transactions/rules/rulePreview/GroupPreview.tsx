import {
  CategoryRuleCondition,
  CategoryRuleGroup,
  connectorLogic,
} from "@/lib/models/CategoryRule";
import { Pocket } from "@/lib/models/Pocket";
import { conditionLead, conditionValue } from "./utils";
import { LogicDivider } from "./LogicDivider";

export function GroupPreview({
  group,
  pockets,
  framed,
}: Readonly<{
  group: CategoryRuleGroup;
  pockets: Pocket[];
  framed: boolean;
}>) {
  const body = (
    <div className="flex min-w-0 flex-col gap-3">
      {group.conditions.map((condition, index) => (
        <div key={index} className="flex min-w-0 flex-col gap-3">
          {index > 0 ? (
            <LogicDivider logic={connectorLogic(group, index) ?? "And"} />
          ) : null}
          <ConditionPreview condition={condition} pockets={pockets} />
        </div>
      ))}
    </div>
  );

  if (!framed) {
    return body;
  }

  return (
    <div className="min-w-0 rounded-lg border border-border/70 bg-muted/20 px-3 py-2.5">
      {body}
    </div>
  );
}

function ConditionPreview({
  condition,
  pockets,
}: Readonly<{
  condition: CategoryRuleCondition;
  pockets: Pocket[];
}>) {
  const value = conditionValue(condition, pockets) || "—";

  if (condition.field === "Description") {
    return (
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">
          {conditionLead(condition)}
        </p>
        <p className="mt-1 text-sm leading-snug break-words">{value}</p>
      </div>
    );
  }

  return (
    <p className="text-sm leading-relaxed">
      <span className="text-muted-foreground">{conditionLead(condition)}</span>{" "}
      <span className="font-medium">{value}</span>
    </p>
  );
}
