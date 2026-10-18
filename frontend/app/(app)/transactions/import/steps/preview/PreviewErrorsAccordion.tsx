"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { TriangleAlert } from "lucide-react";

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
            {errors.map((error, index) => (
              <li
                key={`${index}-${error}`}
                className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2"
              >
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </li>
            ))}
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
