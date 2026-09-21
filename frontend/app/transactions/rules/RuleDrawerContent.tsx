"use client";

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
  CategoryRule,
  CategoryRulePayload,
  cloneRulePayload,
  createCategoryRule,
  createEmptyRule,
  duplicateRulePayload,
  updateCategoryRule,
} from "@/lib/models/CategoryRule";
import { Pocket } from "@/lib/models/Pocket";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { TargetCategorySelect } from "./ConditionRow";
import { RuleBuilder } from "./RuleBuilder";

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
  const [nameInvalid, setNameInvalid] = useState(false);
  const [saving, setSaving] = useState(false);
  const isDuplicate = Boolean(copyFrom);

  const handleSave = useCallback(async () => {
    const nameValid = ruleData.name.trim().length > 0;
    setNameInvalid(!nameValid);
    if (!nameValid) {
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
        <DrawerTitle>
          {rule ? "Edit rule" : isDuplicate ? "Duplicate rule" : "Create rule"}
        </DrawerTitle>
        <DrawerDescription>
          Groups are parentheses. Pick AND or OR inside a group when it has two
          or more conditions, and how groups combine with each other. Without a
          category condition, the rule only matches transactions in Other.
          Description contains matches a whole word, not a substring.
        </DrawerDescription>
      </DrawerHeader>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <FieldGroup className="space-y-4 p-5">
          <Field>
            <FieldLabel htmlFor="rule-name">Name</FieldLabel>
            <Input
              id="rule-name"
              placeholder="Amazon shopping"
              value={ruleData.name}
              onChange={(event) =>
                setRuleData({ ...ruleData, name: event.target.value })
              }
              aria-invalid={nameInvalid}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="target-category">Set category to</FieldLabel>
            <TargetCategorySelect
              value={ruleData.targetCategory}
              onChange={(targetCategory) =>
                setRuleData({ ...ruleData, targetCategory })
              }
            />
          </Field>

          <Field orientation="horizontal">
            <FieldLabel htmlFor="rule-enabled">Enabled</FieldLabel>
            <Switch
              id="rule-enabled"
              checked={ruleData.enabled}
              onCheckedChange={(enabled) =>
                setRuleData({ ...ruleData, enabled })
              }
            />
          </Field>

          <RuleBuilder
            rule={ruleData}
            pockets={pockets}
            onChange={setRuleData}
          />
        </FieldGroup>
      </div>
      <DrawerFooter className="shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t">
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
