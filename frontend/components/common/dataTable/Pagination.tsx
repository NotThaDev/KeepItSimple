"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

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

interface PaginationComponentProps {
  pageIndex: number;
  pageCount: number;
  onPageChange: (pageIndex: number) => void;
  className?: string;
}

export function PaginationComponent({
  pageIndex,
  pageCount,
  onPageChange,
  className,
}: Readonly<PaginationComponentProps>) {
  if (pageCount <= 1) {
    return null;
  }

  const visiblePages = getVisiblePages(pageCount, pageIndex);
  const canPreviousPage = pageIndex > 0;
  const canNextPage = pageIndex < pageCount - 1;

  return (
    <Pagination className={cn("justify-start", className)}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(event) => {
              event.preventDefault();
              if (canPreviousPage) {
                onPageChange(pageIndex - 1);
              }
            }}
            className={!canPreviousPage ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
        {visiblePages.map((page, index) => (
          <PaginationItem key={`page-${index}-${page}`}>
            {page === "ellipsis" ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                href="#"
                isActive={page === pageIndex}
                onClick={(event) => {
                  event.preventDefault();
                  onPageChange(page);
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
            onClick={(event) => {
              event.preventDefault();
              if (canNextPage) {
                onPageChange(pageIndex + 1);
              }
            }}
            className={!canNextPage ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
