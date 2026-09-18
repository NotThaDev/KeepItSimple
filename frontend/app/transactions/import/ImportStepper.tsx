"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTransactionImportContext } from "@/stores/transactionImport";

export const IMPORT_STEPS = [
  {
    id: 1,
    title: "Import",
    description: "Choose the file and destination pocket.",
  },
  {
    id: 2,
    title: "Map",
    description: "Match file columns to the target fields.",
  },
  {
    id: 3,
    title: "Preview",
    description: "Review drafts, categories, and errors.",
  },
  {
    id: 4,
    title: "Confirm",
    description: "Save transactions to the pocket.",
  },
] as const;

export function ImportStepper() {
  const { step: currentStep } = useTransactionImportContext();

  return (
    <TooltipProvider>
      <ol className="flex h-full w-64 shrink-0 flex-col self-stretch pr-2">
        {IMPORT_STEPS.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isLast = index === IMPORT_STEPS.length - 1;

          return (
            <li
              key={step.id}
              className={cn("flex min-h-0 gap-3", !isLast && "flex-1")}
            >
              <div className="flex w-7 shrink-0 flex-col items-center">
                <div
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                    isCompleted &&
                      "border-primary bg-primary text-primary-foreground",
                    isCurrent && "border-primary bg-primary/10 text-primary",
                    !isCompleted &&
                      !isCurrent &&
                      "border-border text-muted-foreground",
                  )}
                >
                  {isCompleted ? <Check className="size-3.5" /> : step.id}
                </div>
                {isLast ? null : (
                  <div
                    className={cn(
                      "mt-1 w-px min-h-4 flex-1",
                      isCompleted ? "bg-primary" : "bg-border",
                    )}
                  />
                )}
              </div>
              <div className="min-w-0 pt-0.5">
                <p
                  className={cn(
                    "text-sm font-medium",
                    isCurrent ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.title}
                </p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="mt-1 h-4 cursor-default truncate text-xs leading-4 text-muted-foreground">
                      {step.description}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-56">
                    {step.description}
                  </TooltipContent>
                </Tooltip>
              </div>
            </li>
          );
        })}
      </ol>
    </TooltipProvider>
  );
}
