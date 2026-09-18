"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { TriangleAlert } from "lucide-react";

function splitPreviewError(error: string) {
  const match = error.match(/^Row (\d+):\s*(.*)$/i);
  if (!match) {
    return { row: null, message: error };
  }

  return { row: match[1], message: match[2] };
}

export function PreviewErrorsAccordion({
  errors,
}: Readonly<{ errors: string[] }>) {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem
        value="preview-errors"
        className="rounded-xl border border-destructive/40 px-4"
      >
        <AccordionTrigger className="text-destructive hover:no-underline">
          Click here to show rows that could not be parsed
        </AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4">
          <ul className="flex flex-col gap-2">
            {errors.map((error, index) => {
              const { row, message } = splitPreviewError(error);

              return (
                <li
                  key={`${index}-${error}`}
                  className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2"
                >
                  <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
                  <div className="min-w-0 flex-1">
                    {row ? (
                      <Badge variant="destructive" className="mb-1">
                        Row {row}
                      </Badge>
                    ) : null}
                    <p className="text-sm text-destructive">{message}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
