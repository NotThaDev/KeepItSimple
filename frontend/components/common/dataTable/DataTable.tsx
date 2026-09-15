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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useEffect, useState } from "react";
import { features, type DataTableFeatures } from "./DataTableFeatures";

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<DataTableFeatures, TData>[];
  data: TData[];
  enablePagination?: boolean;
  initialState?: Omit<Partial<TableState<DataTableFeatures>>, "pagination"> & {
    pagination?: Partial<TableState<DataTableFeatures>["pagination"]>;
  };
  className?: string;
  extraContent?: React.ReactNode;
  onRowSelectionChange?: (selectedRows: TData[]) => void;
}

function getVisiblePages(pageCount: number, currentPage: number) {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index);
  }

  if (currentPage <= 2) {
    return [0, 1, 2, "ellipsis", pageCount - 1] as const;
  }

  if (currentPage >= pageCount - 3) {
    return [
      0,
      "ellipsis",
      pageCount - 3,
      pageCount - 2,
      pageCount - 1,
    ] as const;
  }

  return [
    0,
    "ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis",
    pageCount - 1,
  ] as const;
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  initialState,
  enablePagination = true,
  className,
  extraContent,
  onRowSelectionChange,
}: DataTableProps<TData>) {
  const [rowSelection, setRowSelection] = useState({});

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
    manualPagination: !enablePagination,
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
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

  const pageCount = table.getPageCount();
  const currentPage = table.state.pagination.pageIndex;
  const visiblePages = getVisiblePages(pageCount, currentPage);

  return (
    <div className={`flex w-full flex-col gap-2 ${className ?? ""}`}>
      <div className="overflow-hidden rounded-md border grow">
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

      <div className="flex items-center justify-between px-2">
        {enablePagination && visiblePages.length > 1 && (
          <Pagination className="justify-start">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    table.previousPage();
                  }}
                  className={
                    !table.getCanPreviousPage()
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
              {visiblePages.map((page, index) => (
                <PaginationItem key={`page-${index}-${page}`}>
                  {page === "ellipsis" ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      href="#"
                      isActive={page === currentPage}
                      onClick={(e) => {
                        e.preventDefault();
                        table.setPageIndex(page);
                      }}
                    >
                      {page + 1}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    table.nextPage();
                  }}
                  className={
                    !table.getCanNextPage()
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}

        <div className="ml-auto">{extraContent}</div>
      </div>
    </div>
  );
}
