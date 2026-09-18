"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepperDirection = "horizontal" | "vertical";

export interface StepperItem<TId extends string = string> {
  id: TId;
  title: string;
  description?: string;
}

interface StepperProps<TId extends string = string> {
  steps: readonly StepperItem<TId>[];
  currentStep: TId;
  direction?: StepperDirection;
  className?: string;
}

export function Stepper<TId extends string>({
  steps,
  currentStep,
  direction = "horizontal",
  className,
}: Readonly<StepperProps<TId>>) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);
  const isVertical = direction === "vertical";

  return (
    <ol
      className={cn(
        "flex",
        isVertical ? "h-full flex-col" : "w-full flex-row items-start",
        className,
      )}
    >
      {steps.map((step, index) => {
        const isCompleted = currentIndex > index;
        const isCurrent = currentStep === step.id;
        const isLast = index === steps.length - 1;

        return (
          <li
            key={step.id}
            aria-current={isCurrent ? "step" : undefined}
            className={cn(
              "flex min-h-0 min-w-0",
              isVertical ? "gap-3" : undefined,
              !isLast && "flex-1",
            )}
          >
            {isVertical ? (
              <VerticalStep
                index={index}
                title={step.title}
                description={step.description}
                isCompleted={isCompleted}
                isCurrent={isCurrent}
                isLast={isLast}
              />
            ) : (
              <HorizontalStep
                index={index}
                title={step.title}
                description={step.description}
                isCompleted={isCompleted}
                isCurrent={isCurrent}
                isLast={isLast}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

interface StepContentProps {
  index: number;
  title: string;
  description?: string;
  isCompleted: boolean;
  isCurrent: boolean;
  isLast: boolean;
}

function StepIndicator({
  index,
  isCompleted,
  isCurrent,
}: Readonly<Pick<StepContentProps, "index" | "isCompleted" | "isCurrent">>) {
  return (
    <div
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
        isCompleted && "border-primary bg-primary text-primary-foreground",
        isCurrent && "border-primary bg-primary/10 text-primary",
        !isCompleted && !isCurrent && "border-border text-muted-foreground",
      )}
    >
      {isCompleted ? <Check className="size-3.5" /> : index + 1}
    </div>
  );
}

function VerticalStep({
  index,
  title,
  description,
  isCompleted,
  isCurrent,
  isLast,
}: Readonly<StepContentProps>) {
  return (
    <>
      <div className="flex w-7 shrink-0 flex-col items-center">
        <StepIndicator
          index={index}
          isCompleted={isCompleted}
          isCurrent={isCurrent}
        />
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
          {title}
        </p>
        {description ? (
          <p className="mt-1 h-4 cursor-default text-xs leading-4 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
    </>
  );
}

function HorizontalStep({
  index,
  title,
  description,
  isCompleted,
  isCurrent,
  isLast,
}: Readonly<StepContentProps>) {
  return (
    <>
      <div className="flex min-w-0 flex-col items-center text-center">
        <StepIndicator
          index={index}
          isCompleted={isCompleted}
          isCurrent={isCurrent}
        />
        <p
          className={cn(
            "mt-2 text-sm font-medium",
            isCurrent ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {title}
        </p>
        {description ? (
          <p className="mt-1 text-xs leading-4 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {isLast ? null : (
        <div
          className={cn(
            "mt-3.5 h-px min-w-4 flex-1",
            isCompleted ? "bg-primary" : "bg-border",
          )}
        />
      )}
    </>
  );
}
