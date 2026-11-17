"use client";

import { ENGLISH_DATE_FORMATTER } from "@/components/common/DateUtils";
import { type DataTableFeatures } from "@/components/common/dataTable/DataTableFeatures";
import { ImportMapping } from "@/lib/models/ImportMapping";
import { MappableField } from "@/lib/models/Transaction";
import { createColumnHelper } from "@tanstack/react-table";
import { MappingRowActions } from "./MappingRowActions";

interface MappingColumnsProps {
  onChanged: () => void;
}

const columnHelper = createColumnHelper<DataTableFeatures, ImportMapping>();

export function getMappingColumns({
  onChanged,
}: Readonly<MappingColumnsProps>) {
  return columnHelper.columns([
    columnHelper.accessor("name", {
      header: "Name",
      cell: ({ getValue }) => (
        <div className="max-w-xs truncate">{getValue()}</div>
      ),
    }),
    columnHelper.display({
      id: "columns",
      header: "Columns",
      cell: ({ row }) => {
        const mapped = row.original.columns.filter(
          (column) => column.targetField !== MappableField.Ignore,
        );
        const text = mapped
          .map((column) => `${column.header} → ${column.targetField}`)
          .join(", ");

        return (
          <div className="max-w-md truncate" title={text}>
            {text}
          </div>
        );
      },
    }),
    columnHelper.display({
      id: "updatedAt",
      header: "Updated",
      cell: ({ row }) => ENGLISH_DATE_FORMATTER.format(new Date(row.original.updatedAt)),
    }),
    columnHelper.display({
      id: "actions",
      size: 1,
      header: () => <div className="text-center">Actions</div>,
      cell: ({ row }) => (
        <MappingRowActions mapping={row.original} onChanged={onChanged} />
      ),
    }),
  ]);
}
