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
import {
  deleteImportMapping,
  ImportMapping,
  mappingErrorMessage,
} from "@/lib/models/ImportMapping";
import { EllipsisVertical, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { MappingDrawerContent } from "../mappingDrawer/MappingDrawerContent";

interface MappingActionsMenuProps {
  mapping: ImportMapping;
  onChanged: () => void;
}

export function MappingActionsMenu({
  mapping,
  onChanged,
}: Readonly<MappingActionsMenuProps>) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleDelete = async () => {
    const response = await deleteImportMapping(mapping.id);
    if (response.status !== 204) {
      toast.error(
        mappingErrorMessage(
          response.errorData,
          "Could not delete the mapping.",
        ),
      );
      return;
    }

    toast.success("Mapping deleted");
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
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil />
            Edit
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
          <MappingDrawerContent
            mapping={mapping}
            onSave={() => {
              setEditOpen(false);
              onChanged();
            }}
          />
        ) : null}
      </Drawer>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <ConfirmationDialogContent
          title="Delete mapping"
          description="Imports will no longer apply this mapping automatically. Transactions already imported are not changed."
          onConfirm={handleDelete}
          onCancel={() => setDeleteOpen(false)}
          confirmButtonVariant="destructive"
        />
      </Dialog>
    </>
  );
}
