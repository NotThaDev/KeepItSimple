"use client";

import { Selection } from "@/components/common/selector/Selection";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTransactionImportContext } from "@/stores/transactionImport";
import { SampleRowsAccordion } from "./SampleRowsAccordion";

export function MappingStep() {
  const { analyze, mapping, mappingItems, setMappingField } =
    useTransactionImportContext();

  if (!analyze) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Label>Column mapping</Label>
        <p className="text-xs text-muted-foreground">
          Amount and Date are required. Other columns can be ignored.
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Column</TableHead>
              <TableHead>Maps to</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {analyze.columns.map((column) => (
              <TableRow key={`${analyze.sessionId}-${column.index}`}>
                <TableCell>{column.name}</TableCell>
                <TableCell className="w-56">
                  <Selection
                    items={mappingItems}
                    value={mapping[column.index] ?? "Ignore"}
                    onChange={(value) => setMappingField(column.index, value)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {analyze.sampleRows.length > 0 ? (
        <SampleRowsAccordion
          columns={analyze.columns}
          sampleRows={analyze.sampleRows}
        />
      ) : null}
    </div>
  );
}
