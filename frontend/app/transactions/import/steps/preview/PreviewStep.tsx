"use client";

import { PaginationComponent } from "@/components/common/dataTable/Pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTransactionImportContext } from "@/stores/transactionImport";
import { DescriptionCell } from "../../DescriptionCell";
import { RemoveDraftButton } from "../../RemoveDraftButton";
import { formatDraftDate, IMPORT_TABLE_PAGE_SIZE } from "../../utils";
import { PreviewErrorsAccordion } from "./PreviewErrorsAccordion";
import { TransactionCategorySelector } from "@/app/transactions/TransactionCategorySelector";
import { usePagedItems } from "@/hooks/usePagedItems";

export function PreviewStep() {
  const { preview, selectedPocket, updateDraftCategory } =
    useTransactionImportContext();

  const { pageIndex, pageCount, pageItems, setPageIndex } = usePagedItems(
    preview?.transactions ?? [],
    IMPORT_TABLE_PAGE_SIZE,
  );

  if (!preview) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        {preview.transactions.length} draft
        {preview.transactions.length === 1 ? "" : "s"} for{" "}
        {selectedPocket?.name ?? "the selected pocket"}.
      </p>

      {preview.errors.length > 0 ? (
        <PreviewErrorsAccordion errors={preview.errors} />
      ) : null}

      {pageItems.length > 0 ? (
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-44">Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-24">Amount</TableHead>
              <TableHead className="w-52">Category</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.map(({ item: transaction, index }) => (
              <TableRow key={`${transaction.date}-${index}`}>
                <TableCell>{formatDraftDate(transaction.date)}</TableCell>
                <DescriptionCell value={transaction.description} />
                <TableCell>€{transaction.amount.toFixed(2)}</TableCell>
                <TableCell>
                  <TransactionCategorySelector
                    value={transaction.category}
                    isIncome={transaction.amount > 0}
                    onChange={(category) =>
                      updateDraftCategory(index, category)
                    }
                  />
                </TableCell>
                <TableCell className="text-right">
                  <RemoveDraftButton index={index} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}

      <PaginationComponent
        pageIndex={pageIndex}
        pageCount={pageCount}
        onPageChange={setPageIndex}
        className="justify-end"
      />
    </div>
  );
}
