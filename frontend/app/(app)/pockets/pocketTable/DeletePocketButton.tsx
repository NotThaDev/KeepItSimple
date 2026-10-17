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
import { deletePocket } from "@/lib/models/Pocket";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface DeletePocketButtonProps {
  pocketId: number;
}

export function DeletePocketButton({
  pocketId,
}: Readonly<DeletePocketButtonProps>) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const response = await deletePocket(pocketId);

    if (response.error) {
      toast.error(`Failed to delete pocket: ${response.error}`);
      setIsDeleting(false);
      return;
    }

    toast.success("Pocket deleted successfully!");
    setIsOpen(false);
    router.refresh();
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
          <DialogTitle>Delete Pocket</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this pocket? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 justify-end">
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
