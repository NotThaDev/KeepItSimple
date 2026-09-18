"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { PaginationComponent } from "../dataTable/Pagination";

export interface CommonTableColumn<T> {
  id: string;
  header?: ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  cell: (item: T, index: number) => ReactNode;
}

export interface CommonTablePagination {
  pageIndex: number;
  pageCount: number;
  onPageChange: (pageIndex: number) => void;
  className?: string;
}

interface CommonTableProps<T> {
  columns: CommonTableColumn<T>[];
  data: T[];
  getRowKey: (item: T, index: number) => string;
  className?: string;
  tableClassName?: string;
  pagination?: CommonTablePagination;
}

export function CommonTable<T>({
  columns,
  data,
  getRowKey,
  className,
  tableClassName,
  pagination,
}: Readonly<CommonTableProps<T>>) {
  const table = (
    <Table className={tableClassName}>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column.id} className={column.headerClassName}>
              {column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item, index) => (
          <TableRow key={getRowKey(item, index)}>
            {columns.map((column) => (
              <TableCell key={column.id} className={column.cellClassName}>
                {column.cell(item, index)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {table}
      {pagination ? (
        <PaginationComponent
          pageIndex={pagination.pageIndex}
          pageCount={pagination.pageCount}
          onPageChange={pagination.onPageChange}
          className={pagination.className}
        />
      ) : null}
    </div>
  );
}
