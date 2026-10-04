"use client";

import {
  useTable,
  type ColumnDef,
  type RowData,
  type TableState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import { features, type DataTableFeatures } from "./DataTableFeatures";
import { PaginationComponent } from "./Pagination";

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<DataTableFeatures, TData>[];
  data: TData[];
  enablePagination?: boolean;
  pageCount?: number;
  pageIndex?: number;
  onPageChange?: (pageIndex: number) => void;
  initialState?: Omit<Partial<TableState<DataTableFeatures>>, "pagination"> & {
    pagination?: Partial<TableState<DataTableFeatures>["pagination"]>;
  };
  className?: string;
  extraContent?: React.ReactNode;
  onRowSelectionChange?: (selectedRows: TData[]) => void;
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  initialState,
  enablePagination = true,
  pageCount: controlledPageCount,
  pageIndex: controlledPageIndex = 0,
  onPageChange,
  className,
  extraContent,
  onRowSelectionChange,
}: DataTableProps<TData>) {
  const [rowSelection, setRowSelection] = useState({});
  const isManualPagination = onPageChange != null;

  const table = useTable({
    features,
    data,
    columns,
    initialState: initialState
      ? {
          ...initialState,
          pagination: initialState.pagination
            ? {
                pageIndex: 0,
                pageSize: 10,
                ...initialState.pagination,
              }
            : undefined,
        }
      : undefined,
    manualPagination: isManualPagination || !enablePagination,
    pageCount: controlledPageCount,
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
      ...(isManualPagination
        ? {
            pagination: {
              pageIndex: controlledPageIndex,
              pageSize: initialState?.pagination?.pageSize ?? 10,
            },
          }
        : {}),
    },
  });

  useEffect(() => {
    if (onRowSelectionChange) {
      const selectedRows = table
        .getSelectedRowModel()
        .rows.map((row) => row.original);

      onRowSelectionChange(selectedRows);
    }
    /**
     * We need to extract the values from table because we need the original object
     * but since the table is memoized, we need to add the rowSelection as dependency
     * to trigger the callback function
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRowSelectionChange, rowSelection]);

  const pageCount = controlledPageCount ?? table.getPageCount();
  const currentPage = isManualPagination
    ? controlledPageIndex
    : table.state.pagination.pageIndex;

  const goToPage = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
      return;
    }

    table.setPageIndex(page);
  };

  return (
    <div className={`flex w-full flex-col gap-2 ${className ?? ""}`}>
      <div className="grow overflow-x-auto overflow-y-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder ? null : (
                        <table.FlexRender header={header} />
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                    >
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-2 px-2 sm:flex-row sm:items-center sm:justify-between">
        {enablePagination ? (
          <PaginationComponent
            pageIndex={currentPage}
            pageCount={pageCount}
            onPageChange={goToPage}
          />
        ) : null}

        {extraContent ? (
          <div className="flex flex-wrap justify-end gap-2 sm:ml-auto">
            {extraContent}
          </div>
        ) : null}
      </div>
    </div>
  );
}
