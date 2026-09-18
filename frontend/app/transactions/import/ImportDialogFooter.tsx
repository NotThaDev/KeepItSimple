"use client";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { useTransactionImportContext } from "@/stores/transactionImport";

export function ImportDialogFooter() {
  const {
    step,
    analyze,
    file,
    pocketId,
    isAnalyzing,
    isPreviewing,
    isConfirming,
    preview,
    canContinueToPreview,
    setStep,
    handleAnalyze,
    handlePreview,
    handleConfirm,
  } = useTransactionImportContext();

  return (
    <DialogFooter className="-mx-6 -mb-6 p-6">
      {step === 1 ? (
        analyze ? (
          <Button onClick={() => setStep(2)}>Continue to mapping</Button>
        ) : (
          <Button
            onClick={handleAnalyze}
            disabled={!file || !pocketId || isAnalyzing}
          >
            {isAnalyzing ? "Analyzing…" : "Analyze"}
          </Button>
        )
      ) : null}

      {step === 2 ? (
        <>
          <Button variant="outline" onClick={() => setStep(1)}>
            Back
          </Button>
          <Button
            onClick={handlePreview}
            disabled={!canContinueToPreview || isPreviewing}
          >
            {isPreviewing ? "Building preview…" : "Continue to preview"}
          </Button>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <Button variant="outline" onClick={() => setStep(2)}>
            Back
          </Button>
          <Button
            onClick={() => setStep(4)}
            disabled={!preview || preview.transactions.length === 0}
          >
            Continue to confirm
          </Button>
        </>
      ) : null}

      {step === 4 ? (
        <>
          <Button variant="outline" onClick={() => setStep(3)}>
            Back
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isConfirming || !preview?.transactions.length}
          >
            {isConfirming ? "Saving…" : "Confirm and save"}
          </Button>
        </>
      ) : null}
    </DialogFooter>
  );
}
