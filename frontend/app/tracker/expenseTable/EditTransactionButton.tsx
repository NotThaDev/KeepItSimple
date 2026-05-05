"use client";

import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Expense } from "@/lib/models/Expense";
import { Pencil } from "lucide-react";
import { ExpenseDialogContent } from "../ExpenseDialogContent";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface EditTransactionButtonProps {
  transaction: Expense;
}

export function EditTransactionButton({
  transaction,
}: Readonly<EditTransactionButtonProps>) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const onSave = useCallback(() => {
    router.refresh();
    setOpen(false);
  }, [router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil />
        </Button>
      </DialogTrigger>

      <ExpenseDialogContent onSave={onSave} expense={transaction} />
    </Dialog>
  );
}
