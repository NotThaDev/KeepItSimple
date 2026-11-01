"use client";

import { ConfirmationDialogContent } from "@/components/common/ConfirmationDialogContent";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { deleteReport, downloadReport, Report } from "@/lib/models/Report";
import { Download, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ReportActionsProps {
  report: Report;
  onChanged: () => void;
}

export function ReportActions({
  report,
  onChanged,
}: Readonly<ReportActionsProps>) {
  const [downloading, setDownloading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    const response = await downloadReport(report);
    setDownloading(false);

    if (response.error) {
      toast.error(`Failed to download report: ${response.error}`);
    }
  };

  const handleDelete = async () => {
    const response = await deleteReport(report.id);
    if (response.error) {
      toast.error(`Failed to delete report: ${response.error}`);
      return;
    }

    toast.success("Report deleted");
    setDeleteOpen(false);
    onChanged();
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="sm"
        aria-label="Download report"
        aria-busy={downloading}
        disabled={downloading}
        onClick={handleDownload}
      >
        {downloading ? <Loader2 className="animate-spin" /> : <Download />}
        <span className="hidden sm:inline">Download</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Delete report"
        onClick={() => setDeleteOpen(true)}
      >
        <Trash2 />
      </Button>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <ConfirmationDialogContent
          title="Delete this report?"
          description={`The file for ${report.label} will be removed. You can generate it again.`}
          confirmButtonVariant="destructive"
          onConfirm={handleDelete}
          onCancel={() => setDeleteOpen(false)}
        />
      </Dialog>
    </div>
  );
}
