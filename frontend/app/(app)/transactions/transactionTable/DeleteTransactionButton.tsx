"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { deleteTransaction, Transaction } from "@/lib/models/Transaction";
import { Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { ConfirmationDialogContent } from "@/components/common/ConfirmationDialogContent";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface DeleteTransactionButtonProps {
  transaction: Transaction;
}

export function DeleteTransactionButton({
  transaction,
}: Readonly<DeleteTransactionButtonProps>) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const onDelete = useCallback(async () => {
    if (!transaction.id) {
      setOpen(false);
      return;
    }

    try {
      const deleteResponse = await deleteTransaction(transaction.id!);
      if ("error" in deleteResponse) {
        throw new Error(deleteResponse.error);
      }

      toast.success("Transaction deleted successfully.");
      router.refresh();
    } catch {
      toast.error("Failed to delete transaction. Please try again.");
    } finally {
      setOpen(false);
    }
  }, [router, transaction.id]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 />
        </Button>
      </DialogTrigger>

      <ConfirmationDialogContent
        title="Delete Transaction"
        description="Are you sure you want to delete this transaction? This action cannot be undone."
        onConfirm={onDelete}
        onCancel={() => setOpen(false)}
        confirmButtonVariant="destructive"
      />
    </Dialog>
  );
}
