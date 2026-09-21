"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteCategoryRule } from "@/lib/models/CategoryRule";
import { useState } from "react";
import { toast } from "sonner";

interface DeleteRuleButtonProps {
  ruleId: number;
  onDeleted: () => void;
}

export function DeleteRuleButton({
  ruleId,
  onDeleted,
}: Readonly<DeleteRuleButtonProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const response = await deleteCategoryRule(ruleId);

    if (response.error) {
      toast.error(`Failed to delete rule: ${response.error}`);
      setIsDeleting(false);
      return;
    }

    toast.success("Rule deleted successfully!");
    setIsOpen(false);
    onDeleted();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete rule</DialogTitle>
          <DialogDescription>
            This rule will no longer run on import or when applying to existing
            transactions.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
