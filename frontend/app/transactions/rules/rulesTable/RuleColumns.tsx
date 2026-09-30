"use client";

import { type DataTableFeatures } from "@/components/common/dataTable/DataTableFeatures";
import { Switch } from "@/components/ui/switch";
import { CategoryRule, updateCategoryRule } from "@/lib/models/CategoryRule";
import { Pocket } from "@/lib/models/Pocket";
import { createColumnHelper } from "@tanstack/react-table";
import { toast } from "sonner";
import { RuleCompactView } from "../rulePreview/RuleCompactView";
import { CategoryBadge } from "@/components/common/CategoryBadge";
import { RuleActionsMenu } from "./RuleActionsMenu";
import { useState } from "react";

interface RuleColumnsProps {
  rules: CategoryRule[];
  pockets: Pocket[];
  onMove: (index: number, direction: -1 | 1) => void;
  onChanged: () => void;
  onDuplicate: (rule: CategoryRule) => void;
}

const columnHelper = createColumnHelper<DataTableFeatures, CategoryRule>();

function RuleStatusSwitch({
  rule,
  onChanged,
}: Readonly<{
  rule: CategoryRule;
  onChanged: () => void;
}>) {
  const [isLoading, setIsLoading] = useState(false);

  const handleEnabledChange = async (enabled: boolean) => {
    if (rule.id == null) {
      return;
    }

    setIsLoading(true);
    const response = await updateCategoryRule(rule.id, { ...rule, enabled });

    if (response.error) {
      toast.error(`Failed to update rule: ${response.error}`);
      return;
    }

    toast.success(`Rule ${rule.name} ${enabled ? "enabled" : "disabled"}`);
    setIsLoading(false);
    onChanged();
  };

  return (
    <Switch
      checked={rule.enabled}
      onCheckedChange={handleEnabledChange}
      aria-label={rule.enabled ? "Disable rule" : "Enable rule"}
      disabled={isLoading}
    />
  );
}

export function getRuleColumns({
  rules,
  pockets,
  onMove,
  onChanged,
  onDuplicate,
}: Readonly<RuleColumnsProps>) {
  return columnHelper.columns([
    columnHelper.accessor("name", {
      header: "Name",
      cell: ({ getValue }) => (
        <div className="max-w-xs truncate">{getValue()}</div>
      ),
    }),
    columnHelper.display({
      id: "targetCategory",
      header: "Target category",
      cell: ({ row }) => (
        <CategoryBadge category={row.original.targetCategory} />
      ),
    }),
    columnHelper.display({
      id: "rule",
      header: "Rule",
      cell: ({ row }) => (
        <div className="max-w-[calc(100vw-48rem)] overflow-hidden">
          <RuleCompactView rule={row.original} pockets={pockets} />
        </div>
      ),
    }),
    columnHelper.display({
      id: "status",
      size: 80,
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <RuleStatusSwitch rule={row.original} onChanged={onChanged} />
        </div>
      ),
    }),
    columnHelper.display({
      id: "actions",
      size: 1,
      header: () => <div className="text-center">Actions</div>,
      cell: ({ row }) => {
        const index = rules.findIndex((rule) => rule.id === row.original.id);

        return (
          <div className="flex justify-center">
            <RuleActionsMenu
              rule={row.original}
              pockets={pockets}
              isFirst={index <= 0}
              isLast={index === rules.length - 1}
              onMove={(direction) => onMove(index, direction)}
              onChanged={onChanged}
              onDuplicate={onDuplicate}
            />
          </div>
        );
      },
    }),
  ]);
}
