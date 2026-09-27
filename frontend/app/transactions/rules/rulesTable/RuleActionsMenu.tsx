"use client";

import { ConfirmationDialogContent } from "@/components/common/ConfirmationDialogContent";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteCategoryRule, CategoryRule } from "@/lib/models/CategoryRule";
import { Pocket } from "@/lib/models/Pocket";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  EllipsisVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { RuleDrawerContent } from "../ruleDrawer/RuleDrawerContent";

interface RuleActionsMenuProps {
  rule: CategoryRule;
  pockets: Pocket[];
  isFirst: boolean;
  isLast: boolean;
  onMove: (direction: -1 | 1) => void;
  onChanged: () => void;
  onDuplicate: (rule: CategoryRule) => void;
}

export function RuleActionsMenu({
  rule,
  pockets,
  isFirst,
  isLast,
  onMove,
  onChanged,
  onDuplicate,
}: Readonly<RuleActionsMenuProps>) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleDelete = async () => {
    const response = await deleteCategoryRule(rule.id);
    if (response.error) {
      toast.error(`Failed to delete rule: ${response.error}`);
      return;
    }

    toast.success("Rule deleted successfully!");
    setDeleteOpen(false);
    onChanged();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open actions">
            <EllipsisVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled={isFirst} onClick={() => onMove(-1)}>
            <ArrowUp />
            Move up
          </DropdownMenuItem>
          <DropdownMenuItem disabled={isLast} onClick={() => onMove(1)}>
            <ArrowDown />
            Move down
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDuplicate(rule)}>
            <Copy />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Drawer open={editOpen} onOpenChange={setEditOpen} direction="right">
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

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <ConfirmationDialogContent
          title="Delete rule"
          description="This rule will no longer run on import or when applying to existing transactions."
          onConfirm={handleDelete}
          onCancel={() => setDeleteOpen(false)}
          confirmButtonVariant="destructive"
        />
      </Dialog>
    </>
  );
}
