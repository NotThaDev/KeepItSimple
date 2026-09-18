"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Pocket } from "@/lib/models/Pocket";
import {
  TransactionImportProvider,
  useTransactionImportContext,
} from "@/stores/transactionImport";
import { Upload } from "lucide-react";
import { ImportDialogFooter } from "./ImportDialogFooter";
import { ImportStepper } from "./ImportStepper";
import { AnalyzeStep } from "./steps/AnalyzeStep";
import { ConfirmStep } from "./steps/confirm/ConfirmStep";
import { MappingStep } from "./steps/mapping/MappingStep";
import { PreviewStep } from "./steps/preview/PreviewStep";

interface TransactionImportDialogProps {
  pockets: Pocket[];
  onImported: () => void;
}

export function TransactionImportDialog({
  pockets,
  onImported,
}: Readonly<TransactionImportDialogProps>) {
  return (
    <TransactionImportProvider pockets={pockets} onImported={onImported}>
      <TransactionImportDialogContent />
    </TransactionImportProvider>
  );
}

function TransactionImportDialogContent() {
  const { open, step, handleOpenChange } = useTransactionImportContext();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" variant="outline" className="w-[fit-content]">
          <Upload />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent className="flex h-[85vh] max-h-[90vh] w-[85vw] max-w-[85vw] flex-col gap-6 overflow-hidden p-6 sm:max-w-[85vw]">
        <DialogHeader className="gap-2.5 pr-10">
          <DialogTitle>Import transactions</DialogTitle>
          <DialogDescription>
            Upload a bank export, map the columns, then review and save.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1">
          <ImportStepper />

          <Separator orientation="vertical" className="mx-6" />

          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto py-1 pr-2">
            {step === 1 ? <AnalyzeStep /> : null}
            {step === 2 ? <MappingStep /> : null}
            {step === 3 ? <PreviewStep /> : null}
            {step === 4 ? <ConfirmStep /> : null}
          </div>
        </div>

        <ImportDialogFooter />
      </DialogContent>
    </Dialog>
  );
}
