import { CategoryBadge } from "@/components/common/category/CategoryBadge";
import { Divider } from "@/components/common/Divider";
import { Button } from "@/components/ui/button";
import {
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
  Dialog,
} from "@/components/ui/dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CategoryRule } from "@/lib/models/CategoryRule";
import { Pocket } from "@/lib/models/Pocket";
import { XIcon } from "lucide-react";
import { GroupTextLine } from "./GroupTextLine";
import { LogicBadge } from "./LogicBadge";
import { RulePreview } from "./RulePreview";

interface RuleCompactViewProps {
  rule: CategoryRule;
  pockets: Pocket[];
}

export function RuleCompactView({
  rule,
  pockets,
}: Readonly<RuleCompactViewProps>) {
  const showParens = rule.groups.length > 1;

  return (
    <TooltipProvider>
      <Dialog>
        <DialogTrigger asChild>
          <button
            type="button"
            className="flex w-full min-w-0 items-center rounded-md py-0.5 text-left transition-colors hover:bg-muted/20 cursor-pointer"
          >
            <span className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden whitespace-nowrap">
              {rule.groups.map((group, index) => (
                <span
                  key={index}
                  className="inline-flex shrink-0 items-center gap-1"
                >
                  {index > 0 ? (
                    <LogicBadge logic={rule.groupLogic} compact />
                  ) : null}
                  <GroupTextLine
                    group={group}
                    pockets={pockets}
                    parenthesize={showParens || group.conditions.length >= 2}
                  />
                </span>
              ))}
            </span>
          </button>
        </DialogTrigger>
        <DialogContent
          className="flex max-h-[min(40rem,85vh)] flex-col overflow-hidden sm:max-w-xl"
          showCloseButton={false}
        >
          <DialogHeader>
            <DialogTitle>
              <div className="flex w-full items-center gap-2">
                <span className="text-lg font-medium">{rule.name}</span>
                <Divider className="w-[18px] bg-foreground/30" />
                <CategoryBadge category={rule.targetCategory} />
                <DialogClose asChild>
                  <Button variant="ghost" size="icon-sm" className="ml-auto">
                    <XIcon />
                    <span className="sr-only">Close</span>
                  </Button>
                </DialogClose>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <RulePreview rule={rule} pockets={pockets} />
          </div>
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
