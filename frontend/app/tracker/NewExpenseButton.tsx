"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { ExpenseDialogContent } from "./ExpenseDialogContent";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewExpenseButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleSave = () => {
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg">
          <Plus />
          New Expense
        </Button>
      </DialogTrigger>

      <ExpenseDialogContent onSave={handleSave} />
    </Dialog>
  );
}
