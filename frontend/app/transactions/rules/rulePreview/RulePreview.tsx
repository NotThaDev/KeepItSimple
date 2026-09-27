"use client";

import { CategoryRule } from "@/lib/models/CategoryRule";
import { Pocket } from "@/lib/models/Pocket";
import { GroupPreview } from "./GroupPreview";
import { LogicDivider } from "./LogicDivider";

export function RulePreview({
  rule,
  pockets,
}: Readonly<{
  rule: CategoryRule;
  pockets: Pocket[];
}>) {
  if (rule.groups.length === 0) {
    return <p className="text-sm text-muted-foreground">No conditions</p>;
  }

  const framed = rule.groups.length > 1;

  return (
    <div className="flex min-w-0 flex-col gap-3">
      {rule.groups.map((group, index) => (
        <div key={index} className="flex min-w-0 flex-col gap-3">
          {index > 0 ? <LogicDivider logic={rule.groupLogic} /> : null}
          <GroupPreview
            group={group}
            pockets={pockets}
            framed={framed || group.conditions.length > 1}
          />
        </div>
      ))}
    </div>
  );
}
