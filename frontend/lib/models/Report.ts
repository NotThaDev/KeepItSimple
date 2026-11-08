import { del, FetchWrapperResponse, get, getBlob, post } from "../fetchWrapper";

export enum ReportPeriod {
  LastMonth = "LastMonth",
  LastQuarter = "LastQuarter",
  LastYear = "LastYear",
}

export const REPORT_PERIOD_LABELS: Record<ReportPeriod, string> = {
  [ReportPeriod.LastMonth]: "Last month",
  [ReportPeriod.LastQuarter]: "Last quarter",
  [ReportPeriod.LastYear]: "Last year",
};

export const REPORT_PERIOD_KIND: Record<ReportPeriod, string> = {
  [ReportPeriod.LastMonth]: "Monthly",
  [ReportPeriod.LastQuarter]: "Quarterly",
  [ReportPeriod.LastYear]: "Yearly",
};

export interface Report {
  id: number;
  period: ReportPeriod;
  periodStart: Date;
  periodEnd: Date;
  label: string;
  createdAt: Date;
  fileName: string;
  sizeBytes: number;
}

interface ReportResponse extends Omit<
  Report,
  "periodStart" | "periodEnd" | "createdAt"
> {
  periodStart: string;
  periodEnd: string;
  createdAt: string;
}

function toReport(report: ReportResponse): Report {
  return {
    ...report,
    periodStart: new Date(report.periodStart),
    periodEnd: new Date(report.periodEnd),
    createdAt: new Date(report.createdAt),
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export async function getReports(): Promise<FetchWrapperResponse<Report[]>> {
  const response = await get<ReportResponse[]>("/api/reports");
  return { ...response, data: response.data?.map(toReport) };
}

export async function createReport(
  period: ReportPeriod,
): Promise<FetchWrapperResponse<Report>> {
  const response = await post<ReportResponse>("/api/reports", { period });
  // The only 400 left after the typed period is the stored-reports limit; its body is plain text.
  if (response.status === 400) {
    return {
      error: "You can keep up to 50 reports. Delete old reports first.",
      status: response.status,
    };
  }
  return {
    ...response,
    data: response.data ? toReport(response.data) : undefined,
  };
}

export async function deleteReport(
  id: number,
): Promise<FetchWrapperResponse<void>> {
  return await del(`/api/reports/${id}`);
}

export async function downloadReport(
  report: Report,
): Promise<FetchWrapperResponse<void>> {
  const response = await getBlob(`/api/reports/${report.id}/download`);
  if (!response.data) {
    return { error: response.error, status: response.status };
  }

  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = report.fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoked on the next tick so the browser has started the download.
  setTimeout(() => URL.revokeObjectURL(url));

  return { status: response.status };
}
