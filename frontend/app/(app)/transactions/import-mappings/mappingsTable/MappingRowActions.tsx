"use client";

import { ConfirmationDialogContent } from "@/components/common/ConfirmationDialogContent";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import {
  deleteImportMapping,
  ImportMapping,
  mappingErrorMessage,
} from "@/lib/models/ImportMapping";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { MappingDrawerContent } from "../mappingDrawer/MappingDrawerContent";

interface MappingRowActionsProps {
  mapping: ImportMapping;
  onChanged: () => void;
}

export function MappingRowActions({
  mapping,
  onChanged,
}: Readonly<MappingRowActionsProps>) {
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
      <div className="flex justify-center gap-2 whitespace-nowrap">
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Edit ${mapping.name}`}
          onClick={() => setEditOpen(true)}
        >
          <Pencil />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Delete ${mapping.name}`}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 />
        </Button>
      </div>

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
