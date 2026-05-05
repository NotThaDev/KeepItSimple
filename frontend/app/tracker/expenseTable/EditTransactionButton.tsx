"use client";

import { Button } from "@/components/ui/button";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";
import { Expense } from "@/lib/models/Expense";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { ExpenseDialogContent } from "../ExpenseDialogContent";

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
    <Drawer open={open} onOpenChange={setOpen} direction="right">
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil />
        </Button>
      </DrawerTrigger>

      <ExpenseDialogContent onSave={onSave} expense={transaction} />
    </Drawer>
  );
}
