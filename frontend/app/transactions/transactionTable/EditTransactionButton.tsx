"use client";

import { Button } from "@/components/ui/button";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";
import { Transaction } from "@/lib/models/Transaction";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { TransactionDrawerContent } from "../TransactionDialogContent";

interface EditTransactionButtonProps {
  transaction: Transaction;
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

      <TransactionDrawerContent onSave={onSave} transaction={transaction} />
    </Drawer>
  );
}
