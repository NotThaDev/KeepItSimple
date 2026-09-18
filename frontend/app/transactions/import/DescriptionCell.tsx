"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function DescriptionCell({
  value,
}: Readonly<{ value?: string | null }>) {
  const text = value?.trim() ? value : "-";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <p className="block w-full min-w-0 cursor-default truncate">
            {text}
          </p>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-sm">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
