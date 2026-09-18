"use client";

import { useTransactionImportContext } from "@/stores/transactionImport";
import { DraftSummaryTable } from "./DraftSummaryTable";
import { SummaryCard } from "./SummaryCard";

export function ConfirmStep() {
  const { preview, selectedPocket, previewTotal } =
    useTransactionImportContext();

  if (!preview) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Pocket" value={selectedPocket?.name ?? "-"} />
        <SummaryCard
          label="Transactions"
          value={preview.transactions.length.toString()}
        />
        <SummaryCard label="Net amount" value={`€${previewTotal.toFixed(2)}`} />
      </div>
      <p className="text-sm text-muted-foreground">
        This will create the drafts below and update the pocket balance. You
        cannot undo this in one step.
      </p>
      <DraftSummaryTable transactions={preview.transactions} />
    </div>
  );
}
