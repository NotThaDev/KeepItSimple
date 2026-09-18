"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Selection } from "@/components/common/selector/Selection";
import { useTransactionImportContext } from "@/stores/transactionImport";

export function AnalyzeStep() {
  const {
    file,
    analyze,
    pocketId,
    pocketItems,
    handleFileChange,
    setPocketId,
  } = useTransactionImportContext();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <Label htmlFor="transaction-import-file">File</Label>
          <Input
            id="transaction-import-file"
            type="file"
            accept=".xls,.xlsx,.xlsm,.csv"
            onChange={(event) =>
              handleFileChange(event.target.files?.[0] ?? null)
            }
          />
        </div>
        <div className="flex min-w-56 flex-col gap-2.5 sm:max-w-xs">
          <Label>Pocket</Label>
          <Selection
            items={pocketItems}
            value={pocketId}
            onChange={setPocketId}
            placeholder="Select a pocket"
          />
        </div>
      </div>

      {analyze ? (
        <p className="text-sm text-muted-foreground">
          Found {analyze.columns.length} column
          {analyze.columns.length === 1 ? "" : "s"} in {file?.name}. Continue to
          map Amount and Date.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Supported files: .xls, .xlsx, .xlsm, .csv.
        </p>
      )}
    </div>
  );
}
