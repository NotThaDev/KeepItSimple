import { Divider } from "@/components/common/Divider";
import { LogicBadge } from "./LogicBadge";
import { RuleLogic } from "@/lib/models/CategoryRule";

export function LogicDivider({ logic }: Readonly<{ logic: RuleLogic }>) {
  return (
    <div className="flex items-center gap-3">
      <Divider className="min-w-0 flex-1 bg-foreground/30" />
      <LogicBadge logic={logic} compact />
      <Divider className="min-w-0 flex-1 bg-foreground/30" />
    </div>
  );
}
