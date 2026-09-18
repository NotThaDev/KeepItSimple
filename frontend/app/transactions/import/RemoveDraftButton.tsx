"use client";

import { Button } from "@/components/ui/button";
import { useTransactionImportContext } from "@/stores/transactionImport";
import { Trash2 } from "lucide-react";

export function RemoveDraftButton({
  index,
}: Readonly<{ index: number }>) {
  const { removeDraft } = useTransactionImportContext();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      onClick={() => removeDraft(index)}
      aria-label="Remove transaction"
    >
      <Trash2 />
    </Button>
  );
}
