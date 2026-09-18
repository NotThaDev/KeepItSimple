"use client";

import {
  PaginationComponent,
  usePagedItems,
} from "@/components/common/dataTable/Pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTransactionImportContext } from "@/stores/transactionImport";
import { IMPORT_TABLE_PAGE_SIZE } from "../../utils";
import { DescriptionCell } from "../../DescriptionCell";
import { formatDraftDate } from "../../utils";
import { RemoveDraftButton } from "../../RemoveDraftButton";
import { PreviewErrorsAccordion } from "./PreviewErrorsAccordion";
import { TransactionImportCategorySelect } from "./TransactionImportCategorySelect";

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

      <Table className="table-fixed">
        {pageItems.length > 0 ? (
          <TableHeader>
            <TableRow>
              <TableHead className="w-44">Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-24">Amount</TableHead>
              <TableHead className="w-52">Category</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
        ) : null}
        <TableBody>
          {pageItems.map(({ item: transaction, index }) => (
            <TableRow key={`${transaction.date}-${index}`}>
              <TableCell>{formatDraftDate(transaction.date)}</TableCell>
              <DescriptionCell value={transaction.description} />
              <TableCell>€{transaction.amount.toFixed(2)}</TableCell>
              <TableCell>
                <TransactionImportCategorySelect
                  value={transaction.category}
                  amount={transaction.amount}
                  onChange={(category) => updateDraftCategory(index, category)}
                />
              </TableCell>
              <TableCell className="text-right">
                <RemoveDraftButton index={index} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <PaginationComponent
        pageIndex={pageIndex}
        pageCount={pageCount}
        onPageChange={setPageIndex}
        className="justify-end"
      />
    </div>
  );
}
