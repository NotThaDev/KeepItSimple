"use client";

import { CommonTable } from "@/components/common/table/CommonTable";
import { TransactionImportDraft } from "@/lib/models/Transaction";
import { IMPORT_TABLE_PAGE_SIZE } from "../../utils";
import { DescriptionCell } from "../../DescriptionCell";
import { formatDraftDate } from "../../utils";
import { CategoryBadge } from "@/components/common/CategoryBadge";
import { RemoveDraftButton } from "../../RemoveDraftButton";
import { usePagedItems } from "@/hooks/usePagedItems";

export function DraftSummaryTable({
  transactions,
}: Readonly<{ transactions: TransactionImportDraft[] }>) {
  const { pageIndex, pageCount, pageItems, setPageIndex } = usePagedItems(
    transactions,
    IMPORT_TABLE_PAGE_SIZE - 1, // -1 because we want to show the remove button
  );

  return (
    <CommonTable
      tableClassName="table-fixed"
      columns={[
        {
          id: "date",
          header: "Date",
          headerClassName: "w-44",
          cell: ({ item }) => formatDraftDate(item.date),
        },
        {
          id: "description",
          header: "Description",
          cellClassName: "max-w-0 overflow-hidden",
          cell: ({ item }) => <DescriptionCell value={item.description} />,
        },
        {
          id: "amount",
          header: "Amount",
          headerClassName: "w-24",
          cell: ({ item }) => `€${item.amount.toFixed(2)}`,
        },
        {
          id: "category",
          header: "Category",
          headerClassName: "w-44",
          cell: ({ item }) => <CategoryBadge category={item.category} />,
        },
        {
          id: "actions",
          headerClassName: "w-12",
          cellClassName: "text-right",
          cell: ({ index }) => <RemoveDraftButton index={index} />,
        },
      ]}
      data={pageItems}
      getRowKey={({ item, index }) => `${item.date}-${index}`}
      pagination={{
        pageIndex,
        pageCount,
        onPageChange: setPageIndex,
        className: "justify-end",
      }}
    />
  );
}
