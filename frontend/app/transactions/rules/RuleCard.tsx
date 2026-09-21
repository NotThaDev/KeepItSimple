"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";
import { Switch } from "@/components/ui/switch";
import { CategoryRule, updateCategoryRule } from "@/lib/models/CategoryRule";
import { formatCategoryLabel } from "@/lib/models/Transaction";
import { Pocket } from "@/lib/models/Pocket";
import { ArrowDown, ArrowUp, ListFilter } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DeleteRuleButton } from "./DeleteRuleButton";
import { RuleDrawerContent } from "./RuleDrawerContent";
import { RuleViewDialog } from "./RuleSummary";

interface RuleCardProps {
  rule: CategoryRule;
  pockets: Pocket[];
  isFirst: boolean;
  isLast: boolean;
  onMove: (direction: -1 | 1) => void;
  onChanged: () => void;
  onDuplicate: (rule: CategoryRule) => void;
}

export function RuleCard({
  rule,
  pockets,
  isFirst,
  isLast,
  onMove,
  onChanged,
  onDuplicate,
}: Readonly<RuleCardProps>) {
  const [editOpen, setEditOpen] = useState(false);

  const handleEnabledChange = async (enabled: boolean) => {
    const response = await updateCategoryRule(rule.id, {
      name: rule.name,
      enabled,
      targetCategory: rule.targetCategory,
      groupLogic: rule.groupLogic,
      groups: rule.groups,
    });

    if (response.error) {
      toast.error(`Failed to update rule: ${response.error}`);
      return;
    }

    onChanged();
  };

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="relative pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-lg font-semibold">{rule.name}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Set category to {formatCategoryLabel(rule.targetCategory)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={rule.enabled}
              onCheckedChange={handleEnabledChange}
              aria-label={rule.enabled ? "Disable rule" : "Enable rule"}
            />
            <div className="rounded-lg bg-primary/10 p-2">
              <ListFilter className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative min-w-0 py-2">
        <RuleViewDialog rule={rule} pockets={pockets} />
      </CardContent>
      <CardFooter className="relative justify-end gap-2 py-3">
        <Button
          variant="outline"
          size="icon-sm"
          disabled={isFirst}
          onClick={() => onMove(-1)}
          aria-label="Move rule up"
        >
          <ArrowUp />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          disabled={isLast}
          onClick={() => onMove(1)}
          aria-label="Move rule down"
        >
          <ArrowDown />
        </Button>
        <Drawer open={editOpen} onOpenChange={setEditOpen} direction="right">
          <DrawerTrigger asChild>
            <Button variant="outline" size="sm">
              Edit
            </Button>
          </DrawerTrigger>
          {editOpen ? (
            <RuleDrawerContent
              rule={rule}
              pockets={pockets}
              onSave={() => {
                setEditOpen(false);
                onChanged();
              }}
            />
          ) : null}
        </Drawer>
        <Button variant="outline" size="sm" onClick={() => onDuplicate(rule)}>
          Duplicate
        </Button>
        <DeleteRuleButton ruleId={rule.id} onDeleted={onChanged} />
      </CardFooter>
    </Card>
  );
}
