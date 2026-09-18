import { useMemo, useState } from "react";

const DEFAULT_PAGE_SIZE = 5;

export function usePagedItems<T>(items: T[], pageSize = DEFAULT_PAGE_SIZE) {
  const [pageIndex, setPageIndex] = useState(0);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const start = safePageIndex * pageSize;

  const pageItems = useMemo(
    () =>
      items.slice(start, start + pageSize).map((item, offset) => ({
        item,
        index: start + offset,
      })),
    [items, pageSize, start],
  );

  return {
    pageIndex: safePageIndex,
    pageCount,
    pageItems,
    setPageIndex,
  };
}
