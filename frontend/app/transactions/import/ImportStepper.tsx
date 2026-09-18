"use client";

import { Stepper } from "@/components/common/stepper/Stepper";
import {
  ImportStep,
  useTransactionImportContext,
} from "@/stores/transactionImport";

export const IMPORT_STEPS = [
  {
    id: ImportStep.Analyze,
    title: "Import",
    description: "Choose the file and destination pocket.",
  },
  {
    id: ImportStep.Mapping,
    title: "Map",
    description: "Match file columns to the target fields.",
  },
  {
    id: ImportStep.Preview,
    title: "Preview",
    description: "Review drafts, categories, and errors.",
  },
  {
    id: ImportStep.Confirm,
    title: "Confirm",
    description: "Save transactions to the pocket.",
  },
] as const;

export function ImportStepper() {
  const { step } = useTransactionImportContext();

  return (
    <Stepper
      steps={IMPORT_STEPS}
      currentStep={step}
      direction="vertical"
      className="w-64 shrink-0 self-stretch pr-2"
    />
  );
}
