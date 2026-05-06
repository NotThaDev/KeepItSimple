"use client";

import { Button } from "@/components/ui/button";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ExpenseDialogContent } from "./ExpenseDialogContent";

export function NewExpenseButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleSave = () => {
    setOpen(false);
    router.refresh();
  };

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="right">
      <DrawerTrigger asChild>
        <Button size="lg" className="w-[fit-content]">
          <Plus />
          New Expense
        </Button>
      </DrawerTrigger>

      <ExpenseDialogContent onSave={handleSave} />
    </Drawer>
  );
}
