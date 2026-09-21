"use client";

import { DescriptionCell } from "@/app/transactions/import/DescriptionCell";
import { formatDraftDate } from "@/app/transactions/import/utils";
import { CategoryBadge } from "@/components/common/CategoryBadge";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { formatDateOnly } from "@/components/common/DateUtils";
import { Selection } from "@/components/common/selector/Selection";
import { CommonTable } from "@/components/common/table/CommonTable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { usePagedItems } from "@/hooks/usePagedItems";
import {
  applyCategoryRules,
  CategoryRuleApplyPreviewItem,
  previewApplyCategoryRules,
} from "@/lib/models/CategoryRule";
import { Pocket } from "@/lib/models/Pocket";
import { startOfDay, subMonths } from "date-fns";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const ALL_POCKETS = "all";
const PREVIEW_PAGE_SIZE = 5;

function defaultToDate(): Date {
  return startOfDay(new Date());
}

function defaultFromDate(): Date {
  return subMonths(defaultToDate(), 3);
}

interface ApplyRulesDialogProps {
  pockets: Pocket[];
}

export function ApplyRulesDialog({ pockets }: Readonly<ApplyRulesDialogProps>) {
  const [open, setOpen] = useState(false);
  const [pocketId, setPocketId] = useState<string>(ALL_POCKETS);
  const [from, setFrom] = useState<Date | undefined>(defaultFromDate);
  const [to, setTo] = useState<Date>(defaultToDate);
  const [preview, setPreview] = useState<CategoryRuleApplyPreviewItem[] | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const previewItems = preview ?? [];
  const { pageIndex, pageCount, pageItems, setPageIndex } = usePagedItems(
    previewItems,
    PREVIEW_PAGE_SIZE,
  );

  const pocketItems = useMemo(
    () => [
      { value: ALL_POCKETS, label: "All pockets" },
      ...pockets.map((pocket) => ({
        value: pocket.id.toString(),
        label: pocket.name,
      })),
    ],
    [pockets],
  );

  const resetFilters = () => {
    setPocketId(ALL_POCKETS);
    setFrom(defaultFromDate());
    setTo(defaultToDate());
    setPreview(null);
  };

  const handlePreview = async () => {
    setLoading(true);
    const parsedPocketId =
      pocketId === ALL_POCKETS ? undefined : Number.parseInt(pocketId, 10);
    const response = await previewApplyCategoryRules({
      pocketId: parsedPocketId,
      from: from ? formatDateOnly(from) : undefined,
      to: formatDateOnly(to),
    });
    setLoading(false);

    if (response.error || !response.data) {
      toast.error(`Failed to preview rules: ${response.error}`);
      return;
    }

    setPreview(response.data);
    setPageIndex(0);
  };

  const handleApply = async () => {
    if (!preview || preview.length === 0) {
      return;
    }

    setApplying(true);
    const response = await applyCategoryRules(
      preview.map((item) => item.transactionId),
    );
    setApplying(false);

    if (response.error) {
      toast.error(`Failed to apply rules: ${response.error}`);
      return;
    }

    toast.success(
      `Updated ${response.data?.updatedCount ?? preview.length} transaction${
        preview.length === 1 ? "" : "s"
      }.`,
    );
    setPreview(null);
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          resetFilters();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">Apply to existing</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Apply rules to existing transactions</DialogTitle>
          <DialogDescription>
            Choose a pocket and a date range, then preview which saved
            transactions would change. Categories you set by hand can be
            overwritten.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-48 flex-col gap-2">
            <p className="text-sm font-medium">Pocket</p>
            <Selection
              className="w-[200px]"
              items={pocketItems}
              value={pocketId}
              placeholder="All pockets"
              onChange={(value) => {
                setPocketId(value);
                setPreview(null);
              }}
            />
          </div>
          <div className="flex min-w-48 flex-col gap-2">
            <p className="text-sm font-medium">Date range</p>
            <DateRangePicker
              from={from}
              to={to}
              onDateRangeChange={(nextFrom, nextTo) => {
                setFrom(nextFrom);
                setTo(nextTo);
                setPreview(null);
              }}
            />
          </div>
          <Button onClick={handlePreview} disabled={loading}>
            {loading ? "Previewing..." : "Preview"}
          </Button>
        </div>

        {preview ? (
          preview.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No saved transactions in this pocket and date range would change.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">
                {preview.length} transaction
                {preview.length === 1 ? "" : "s"} would change.
              </p>
              <CommonTable
                tableClassName="table-fixed"
                getRowKey={(item) => String(item.transactionId)}
                data={pageItems.map(({ item }) => item)}
                pagination={{
                  pageIndex,
                  pageCount,
                  onPageChange: setPageIndex,
                  className: "justify-end",
                }}
                columns={[
                  {
                    id: "date",
                    header: "Date",
                    headerClassName: "w-44",
                    cell: (item) => formatDraftDate(item.date),
                  },
                  {
                    id: "description",
                    header: "Description",
                    cellClassName: "max-w-0 overflow-hidden",
                    cell: (item) => (
                      <DescriptionCell value={item.description} />
                    ),
                  },
                  {
                    id: "amount",
                    header: "Amount",
                    headerClassName: "w-28",
                    cell: (item) => `€${item.amount.toFixed(2)}`,
                  },
                  {
                    id: "from",
                    header: "Current",
                    headerClassName: "w-28",
                    cell: (item) => (
                      <CategoryBadge category={item.oldCategory} />
                    ),
                  },
                  {
                    id: "to",
                    header: "New",
                    headerClassName: "w-28",
                    cell: (item) => (
                      <CategoryBadge category={item.newCategory} />
                    ),
                  },
                  {
                    id: "rule",
                    header: "Rule",
                    headerClassName: "w-40",
                    cellClassName: "overflow-hidden",
                    cell: (item) => (
                      <DescriptionCell value={item.matchedRuleName} />
                    ),
                  },
                ]}
              />
            </div>
          )
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={!preview || preview.length === 0 || applying}
          >
            {applying ? "Applying..." : "Apply changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
