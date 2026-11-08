import { type DataTableFeatures } from "@/components/common/dataTable/DataTableFeatures";
import { Badge } from "@/components/ui/badge";
import {
  formatFileSize,
  REPORT_PERIOD_KIND,
  Report,
} from "@/lib/models/Report";
import { createColumnHelper } from "@tanstack/react-table";
import { ReportActions } from "./ReportActions";

interface ReportColumnsProps {
  onChanged: () => void;
}

const columnHelper = createColumnHelper<DataTableFeatures, Report>();

const GENERATED_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function getReportColumns({ onChanged }: Readonly<ReportColumnsProps>) {
  return columnHelper.columns([
    // One column for the report details, so the actions stay visible at 375px.
    columnHelper.display({
      id: "report",
      header: "Report",
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{row.original.label}</span>
            <Badge variant="secondary">
              {REPORT_PERIOD_KIND[row.original.period]}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {GENERATED_FORMATTER.format(row.original.createdAt)} ·{" "}
            {formatFileSize(row.original.sizeBytes)}
          </span>
        </div>
      ),
    }),
    columnHelper.display({
      id: "actions",
      size: 1,
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <ReportActions report={row.original} onChanged={onChanged} />
        </div>
      ),
    }),
  ]);
}
