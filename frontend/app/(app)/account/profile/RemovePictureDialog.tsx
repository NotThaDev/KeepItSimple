"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { ConfirmationDialogContent } from "@/components/common/ConfirmationDialogContent";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";

interface RemovePictureDialogProps {
  busy: boolean;
  onRemove: () => Promise<void>;
}

export function RemovePictureDialog({
  busy,
  onRemove,
}: Readonly<RemovePictureDialogProps>) {
  const [open, setOpen] = useState(false);

  async function onConfirm() {
    await onRemove();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={busy}>
          <Trash2 />
          Remove
        </Button>
      </DialogTrigger>
      <ConfirmationDialogContent
        title="Remove picture"
        description="Your avatar goes back to the initial letter. You can upload a new one anytime."
        onConfirm={onConfirm}
        onCancel={() => setOpen(false)}
        confirmButtonVariant="destructive"
      />
    </Dialog>
  );
}
