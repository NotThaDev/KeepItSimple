"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Category,
  CategoryUsage,
  deleteCategory,
  getCategoryUsage,
} from "@/lib/models/Category";
import { EllipsisVertical, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CategoryDrawerContent } from "../categoryDrawer/CategoryDrawerContent";

interface CategoryActionsMenuProps {
  category: Category;
  onChanged: () => void;
}

export function CategoryActionsMenu({
  category,
  onChanged,
}: Readonly<CategoryActionsMenuProps>) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [usage, setUsage] = useState<CategoryUsage | null>(null);

  const openDelete = async () => {
    setUsage(null);
    setDeleteOpen(true);
    const response = await getCategoryUsage(category.id);
    if (response.data) {
      setUsage(response.data);
    }
  };

  const handleDelete = async () => {
    const response = await deleteCategory(category.id);
    if (response.error) {
      toast.error(`Failed to delete category: ${response.error}`);
      return;
    }

    toast.success("Category deleted");
    setDeleteOpen(false);
    onChanged();
  };

  const lines = usage
    ? [
        usage.transactions > 0 &&
          `${usage.transactions} ${usage.transactions === 1 ? "transaction" : "transactions"} will move to Other.`,
        usage.rules > 0 &&
          `${usage.rules === 1 ? "1 rule that uses it" : `${usage.rules} rules that use it`} will be disabled.`,
      ].filter(Boolean)
    : [];
  const description = usage
    ? lines.join(" ") || "It isn't used by any transaction or rule."
    : "Checking where it is used…";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open actions">
            <EllipsisVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={openDelete}>
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Drawer open={editOpen} onOpenChange={setEditOpen} direction="right">
        {editOpen ? (
          <CategoryDrawerContent
            category={category}
            onSave={() => {
              setEditOpen(false);
              onChanged();
            }}
          />
        ) : null}
      </Drawer>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete “{category.name}”?</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              disabled={!usage}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
