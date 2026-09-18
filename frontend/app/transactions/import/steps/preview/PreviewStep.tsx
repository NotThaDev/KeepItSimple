"use client";

import { PaginationComponent } from "@/components/common/dataTable/Pagination";
import { CommonTable } from "@/components/common/table/CommonTable";
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

  const pagination = {
    pageIndex,
    pageCount,
    onPageChange: setPageIndex,
    className: "justify-end",
  };

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
              cell: ({ item }) => (
                <DescriptionCell value={item.description} />
              ),
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
              headerClassName: "w-52",
              cell: ({ item, index }) => (
                <TransactionCategorySelector
                  value={item.category}
                  isIncome={item.amount > 0}
                  onChange={(category) =>
                    updateDraftCategory(index, category)
                  }
                />
              ),
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
          pagination={pagination}
        />
      ) : (
        <PaginationComponent {...pagination} />
      )}
    </div>
  );
}
