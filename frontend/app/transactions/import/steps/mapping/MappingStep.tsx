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
import { isMappableField, MappableField } from "@/lib/models/Transaction";
import { useTransactionImportContext } from "@/stores/transactionImport";
import { SampleRowsAccordion } from "./SampleRowsAccordion";

const MAPPING_ITEMS = Object.values(MappableField).map((field) => ({
  value: field,
  label: field,
}));

export function MappingStep() {
  const { analyze, mapping, setMappingField } = useTransactionImportContext();

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
                    items={MAPPING_ITEMS}
                    value={mapping[column.index] ?? MappableField.Ignore}
                    onChange={(value) => {
                      if (isMappableField(value)) {
                        setMappingField(column.index, value);
                      }
                    }}
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
