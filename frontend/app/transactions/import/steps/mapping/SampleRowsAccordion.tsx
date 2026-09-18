"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CommonTable } from "@/components/common/table/CommonTable";
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
        <AccordionContent>
          <CommonTable<(typeof pageItems)[number]>
            columns={columns.map((column) => ({
              id: String(column.index),
              header: column.name,
              cell: ({ item }) => item[column.name] ?? "",
            }))}
            data={pageItems}
            getRowKey={({ index }) => String(index)}
            pagination={{
              pageIndex,
              pageCount,
              onPageChange: setPageIndex,
              className: "justify-end",
            }}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
