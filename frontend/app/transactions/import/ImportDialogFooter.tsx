"use client";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import {
  ImportStep,
  importLoadingMessage,
  useTransactionImportContext,
} from "@/stores/transactionImport";

export function ImportDialogFooter() {
  const {
    step,
    analyze,
    file,
    selectedPocket,
    isLoading,
    preview,
    canContinueToPreview,
    setStep,
    analyzeFile,
    previewTransactions: previewTransactions,
    confirmTransactions: confirmTransactions,
  } = useTransactionImportContext();

  return (
    <DialogFooter className="-mx-6 -mb-6 p-6">
      {step === ImportStep.Analyze ? (
        analyze ? (
          <Button onClick={() => setStep(ImportStep.Mapping)}>
            Continue to mapping
          </Button>
        ) : (
          <Button
            onClick={analyzeFile}
            disabled={!file || !selectedPocket || isLoading}
          >
            {isLoading ? importLoadingMessage(step) : "Analyze"}
          </Button>
        )
      ) : null}

      {step === ImportStep.Mapping ? (
        <>
          <Button variant="outline" onClick={() => setStep(ImportStep.Analyze)}>
            Back
          </Button>
          <Button
            onClick={previewTransactions}
            disabled={!canContinueToPreview || isLoading}
          >
            {isLoading ? importLoadingMessage(step) : "Continue to preview"}
          </Button>
        </>
      ) : null}

      {step === ImportStep.Preview ? (
        <>
          <Button variant="outline" onClick={() => setStep(ImportStep.Mapping)}>
            Back
          </Button>
          <Button
            onClick={() => setStep(ImportStep.Confirm)}
            disabled={!preview || preview.transactions.length === 0}
          >
            Continue to confirm
          </Button>
        </>
      ) : null}

      {step === ImportStep.Confirm ? (
        <>
          <Button variant="outline" onClick={() => setStep(ImportStep.Preview)}>
            Back
          </Button>
          <Button
            onClick={confirmTransactions}
            disabled={isLoading || !preview?.transactions.length}
          >
            {isLoading ? importLoadingMessage(step) : "Confirm and save"}
          </Button>
        </>
      ) : null}
    </DialogFooter>
  );
}
