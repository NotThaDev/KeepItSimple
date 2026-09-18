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
import { TransactionImportDraft } from "@/lib/models/Transaction";
import { IMPORT_TABLE_PAGE_SIZE } from "../../utils";
import { DescriptionCell } from "../../DescriptionCell";
import { formatDraftDate } from "../../utils";
import { CategoryBadge } from "./CategoryBadge";
import { RemoveDraftButton } from "../../RemoveDraftButton";

export function DraftSummaryTable({
  transactions,
}: Readonly<{ transactions: TransactionImportDraft[] }>) {
  const { pageIndex, pageCount, pageItems, setPageIndex } = usePagedItems(
    transactions,
    IMPORT_TABLE_PAGE_SIZE - 1, // -1 because we want to show the remove button
  );

  return (
    <div className="flex flex-col gap-4">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-44">Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-24">Amount</TableHead>
            <TableHead className="w-44">Category</TableHead>
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
                <CategoryBadge category={transaction.category} />
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
