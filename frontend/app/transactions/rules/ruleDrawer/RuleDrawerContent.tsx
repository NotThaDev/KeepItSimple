"use client";

import { TransactionCategorySelector } from "@/app/transactions/TransactionCategorySelector";
import { Button } from "@/components/ui/button";
import {
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CategoryRule,
  CategoryRulePayload,
  cloneRulePayload,
  createCategoryRule,
  createEmptyRule,
  duplicateRulePayload,
  updateCategoryRule,
} from "@/lib/models/CategoryRule";
import { Pocket } from "@/lib/models/Pocket";
import { Info } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { RuleBuilder } from "./RuleBuilder";
import { RuleValidation, validateRule } from "./utils";

const RULE_DRAWER_HELP =
  "Groups are parentheses. Pick AND or OR inside a group when it has two or more conditions, and how groups combine with each other. Without a category condition, the rule only matches transactions in Other. Description contains matches a whole word, not a substring.";

interface RuleDrawerContentProps {
  rule?: CategoryRule;
  copyFrom?: CategoryRule;
  pockets: Pocket[];
  onSave?: () => void;
}

function toPayload(
  rule?: CategoryRule,
  copyFrom?: CategoryRule,
): CategoryRulePayload {
  if (rule) {
    return cloneRulePayload(rule);
  }

  if (copyFrom) {
    return duplicateRulePayload(copyFrom);
  }

  return createEmptyRule();
}

export function RuleDrawerContent({
  rule,
  copyFrom,
  pockets,
  onSave,
}: Readonly<RuleDrawerContentProps>) {
  const [ruleData, setRuleData] = useState<CategoryRulePayload>(() =>
    toPayload(rule, copyFrom),
  );
  const [validation, setValidation] = useState<RuleValidation | null>(null);
  const [saving, setSaving] = useState(false);
  const isDuplicate = Boolean(copyFrom);

  const updateRule = useCallback((next: CategoryRulePayload) => {
    setRuleData(next);
    setValidation((current) => (current ? validateRule(next) : null));
  }, []);

  const handleSave = useCallback(async () => {
    const nextValidation = validateRule(ruleData);
    setValidation(nextValidation);
    if (nextValidation) {
      return;
    }

    setSaving(true);
    const response = rule
      ? await updateCategoryRule(rule.id, ruleData)
      : await createCategoryRule(ruleData);
    setSaving(false);

    if (response.error) {
      toast.error(
        `Failed to ${rule ? "update" : "create"} rule: ${response.error}`,
      );
      return;
    }

    toast.success(
      `Rule ${rule ? "updated" : isDuplicate ? "duplicated" : "created"} successfully!`,
    );
    onSave?.();
  }, [isDuplicate, onSave, rule, ruleData]);

  return (
    <DrawerContent className="h-full overflow-hidden data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-2xl">
      <DrawerHeader>
        <div className="flex items-center gap-2">
          <DrawerTitle>
            {rule
              ? "Edit rule"
              : isDuplicate
                ? "Duplicate rule"
                : "Create rule"}
          </DrawerTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="How rules work"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Info className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="z-[60] max-w-sm text-pretty"
              >
                {RULE_DRAWER_HELP}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <DrawerDescription className="sr-only">
          {RULE_DRAWER_HELP}
        </DrawerDescription>
      </DrawerHeader>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <FieldGroup className="space-y-4 p-5">
          <div className="flex gap-3">
            <Field>
              <FieldLabel htmlFor="rule-name">Name</FieldLabel>
              <Input
                id="rule-name"
                placeholder="Amazon shopping"
                value={ruleData.name}
                onChange={(event) =>
                  updateRule({ ...ruleData, name: event.target.value })
                }
                aria-invalid={validation?.nameInvalid}
              />
            </Field>

            <Field className="w-[220px]">
              <FieldLabel htmlFor="target-category">Set category to</FieldLabel>
              <TransactionCategorySelector
                showAll
                value={ruleData.targetCategory}
                onChange={(targetCategory) =>
                  updateRule({ ...ruleData, targetCategory })
                }
              />
            </Field>
          </div>

          <RuleBuilder
            rule={ruleData}
            pockets={pockets}
            errors={validation?.conditions}
            onChange={updateRule}
          />
        </FieldGroup>
      </div>
      <DrawerFooter className="shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t">
        <Field orientation="horizontal">
          <Switch
            id="rule-enabled"
            checked={ruleData.enabled}
            onCheckedChange={(enabled) => updateRule({ ...ruleData, enabled })}
          />
        </Field>

        <DrawerClose asChild>
          <Button variant="outline">Cancel</Button>
        </DrawerClose>
        <Button onClick={handleSave} disabled={saving}>
          {rule ? "Update" : isDuplicate ? "Duplicate" : "Save"}
        </Button>
      </DrawerFooter>
    </DrawerContent>
  );
}
