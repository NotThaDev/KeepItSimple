"use client";

import { DateRangePicker } from "@/components/common/DateRangePicker";
import { parseDateOnly, formatDateOnly } from "@/components/common/DateUtils";
import { Selection } from "@/components/common/selector/Selection";
import { Input } from "@/components/ui/input";
import { Pocket } from "@/lib/models/Pocket";
import {
  formatCategoryLabel,
  TransactionCategory,
  TransactionListQuery,
} from "@/lib/models/Transaction";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const ALL_VALUE = "all";

interface TransactionFiltersProps {
  pockets: Pocket[];
  filters: TransactionListQuery;
  onChange: (patch: Partial<TransactionListQuery>) => void;
}

export function TransactionFilters({
  pockets,
  filters,
  onChange,
}: Readonly<TransactionFiltersProps>) {
  const [search, setSearch] = useState(filters.search ?? "");
  const [committedSearch, setCommittedSearch] = useState(filters.search);

  if (filters.search !== committedSearch) {
    setCommittedSearch(filters.search);
    setSearch(filters.search ?? "");
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const nextSearch = search.trim() || undefined;
      if (nextSearch !== (filters.search || undefined)) {
        onChange({ search: nextSearch });
      }
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [filters.search, onChange, search]);

  const pocketItems = useMemo(
    () => [
      { value: ALL_VALUE, label: "All pockets" },
      ...pockets.map((pocket) => ({
        value: pocket.id.toString(),
        label: pocket.name,
      })),
    ],
    [pockets],
  );

  const categoryItems = useMemo(
    () => [
      { value: ALL_VALUE, label: "All categories" },
      ...Object.values(TransactionCategory).map((category) => ({
        value: category,
        label: formatCategoryLabel(category),
      })),
    ],
    [],
  );

  const fromDate = useMemo(
    () => (filters.from ? parseDateOnly(filters.from) : undefined),
    [filters.from],
  );
  const toDate = useMemo(
    () => (filters.to ? parseDateOnly(filters.to) : undefined),
    [filters.to],
  );

  return (
    <div className="flex w-full items-center gap-2 overflow-x-auto">
      <div className="relative min-w-[180px] flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search description"
          className="pl-8"
          aria-label="Search description"
        />
      </div>
      <Selection
        className="w-[180px] shrink-0"
        items={pocketItems}
        value={filters.pocketId?.toString() ?? ALL_VALUE}
        placeholder="All pockets"
        onChange={(value) =>
          onChange({
            pocketId: value === ALL_VALUE ? undefined : Number(value),
          })
        }
      />
      <Selection
        className="w-[180px] shrink-0"
        items={categoryItems}
        value={filters.category ?? ALL_VALUE}
        placeholder="All categories"
        onChange={(value) =>
          onChange({
            category:
              value === ALL_VALUE ? undefined : (value as TransactionCategory),
          })
        }
      />
      <DateRangePicker
        from={fromDate}
        to={toDate}
        onDateRangeChange={(from, to) =>
          onChange({
            from: from ? formatDateOnly(from) : undefined,
            to: formatDateOnly(to),
          })
        }
      />
    </div>
  );
}
