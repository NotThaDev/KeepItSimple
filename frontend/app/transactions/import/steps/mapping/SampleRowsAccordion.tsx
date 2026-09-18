"use client";

import { PaginationComponent } from "@/components/common/dataTable/Pagination";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TransactionImportAnalyzeResponse } from "@/lib/models/Transaction";
import { IMPORT_TABLE_PAGE_SIZE } from "../../utils";
import { usePagedItems } from "@/hooks/usePagedItems";

export function SampleRowsAccordion({
  columns,
  sampleRows,
}: Readonly<{
  columns: TransactionImportAnalyzeResponse["columns"];
  sampleRows: TransactionImportAnalyzeResponse["sampleRows"];
}>) {
  const { pageIndex, pageCount, pageItems, setPageIndex } = usePagedItems(
    sampleRows,
    IMPORT_TABLE_PAGE_SIZE,
  );

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="sample-rows" className="rounded-xl border px-4">
        <AccordionTrigger className="hover:no-underline">
          Click here to show the found rows
        </AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.index}>{column.name}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map(({ item: row, index }) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={column.index}>
                      {row[column.name] ?? ""}
                    </TableCell>
                  ))}
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
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
