"use client";

import { DataTable } from "@/components/common/dataTable/DataTable";
import { EmptyStateCard } from "@/components/common/emptyState/EmptyStateCard";
import { Selection } from "@/components/common/selector/Selection";
import { Button } from "@/components/ui/button";
import { FetchWrapperResponse } from "@/lib/fetchWrapper";
import {
  createReport,
  REPORT_PERIOD_LABELS,
  Report,
  ReportPeriod,
} from "@/lib/models/Report";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { getReportColumns } from "./reportsTable/ReportColumns";

interface ReportsPageContentProps {
  reportsResponse: FetchWrapperResponse<Report[]>;
}

const PERIOD_ITEMS = Object.values(ReportPeriod).map((period) => ({
  value: period,
  label: REPORT_PERIOD_LABELS[period],
}));

const EMPTY_DESCRIPTION =
  "Generate an Excel report for last month, quarter or year: totals, categories, trends and one sheet per pocket.";

export function ReportsPageContent({
  reportsResponse,
}: Readonly<ReportsPageContentProps>) {
  const router = useRouter();
  const [period, setPeriod] = useState<ReportPeriod>(ReportPeriod.LastMonth);
  const [generating, setGenerating] = useState(false);

  if ("error" in reportsResponse) {
    toast.error("Failed to load reports. Please try again later.");
  }

  const reports = useMemo(
    () => reportsResponse.data ?? [],
    [reportsResponse.data],
  );

  const columns = useMemo(
    () => getReportColumns({ onChanged: () => router.refresh() }),
    [router],
  );

  const generate = async () => {
    setGenerating(true);
    const response = await createReport(period);
    setGenerating(false);

    if (response.error || !response.data) {
      toast.error(`Failed to generate report: ${response.error}`);
      return;
    }

    toast.success(`Report for ${response.data.label} is ready`);
    router.refresh();
  };

  const toolbar = (
    <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:w-auto">
      <Selection
        aria-label="Report period"
        className="w-full sm:w-44"
        items={PERIOD_ITEMS}
        value={period}
        onChange={(value) => setPeriod(value as ReportPeriod)}
        disabled={generating}
      />
      <Button
        size="lg"
        className="w-full sm:w-auto"
        onClick={generate}
        disabled={generating}
        aria-busy={generating}
      >
        {generating ? <Loader2 className="animate-spin" /> : <FileSpreadsheet />}
        {generating ? "Generating…" : "Generate report"}
      </Button>
    </div>
  );

  if (reports.length === 0) {
    return (
      <div className="flex w-full min-w-0 flex-1 items-center justify-center">
        <EmptyStateCard
          title="No reports yet"
          description={EMPTY_DESCRIPTION}
          icon={FileSpreadsheet}
        >
          {toolbar}
        </EmptyStateCard>
      </div>
    );
  }

  return (
    <DataTable
      className="min-h-[580px]"
      columns={columns}
      data={reports}
      initialState={{ pagination: { pageSize: 10 } }}
      extraContent={toolbar}
    />
  );
}
