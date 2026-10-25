"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { ConfirmationDialogContent } from "@/components/common/ConfirmationDialogContent";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";

interface RevokeOthersDialogProps {
  busy: boolean;
  onRevokeOthers: () => Promise<void>;
}

export function RevokeOthersDialog({
  busy,
  onRevokeOthers,
}: Readonly<RevokeOthersDialogProps>) {
  const [open, setOpen] = useState(false);

  const onConfirm = async () => {
    await onRevokeOthers();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={busy}>
          <LogOut />
          Log out all other devices
        </Button>
      </DialogTrigger>
      <ConfirmationDialogContent
        title="Log out all other devices"
        description="Every other device will need to log in again. This device stays logged in."
        onConfirm={onConfirm}
        onCancel={() => setOpen(false)}
        confirmButtonVariant="destructive"
      />
    </Dialog>
  );
}
