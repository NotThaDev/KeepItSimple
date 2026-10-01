"use client";

import { Selection } from "@/components/common/selector/Selection";
import { CommonTable } from "@/components/common/table/CommonTable";
import { Label } from "@/components/ui/label";
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
        <CommonTable
          columns={[
            {
              id: "column",
              header: "Column",
              cell: (column) => column.name,
            },
            {
              id: "mapsTo",
              header: "Maps to",
              cellClassName: "w-56",
              cell: (column) => (
                <Selection
                  items={MAPPING_ITEMS}
                  value={mapping[column.index] ?? MappableField.Ignore}
                  onChange={(value) => {
                    if (isMappableField(value)) {
                      setMappingField(column.index, value);
                    }
                  }}
                />
              ),
            },
          ]}
          data={analyze.columns}
          getRowKey={(column) => `${analyze.sessionId}-${column.index}`}
        />
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
