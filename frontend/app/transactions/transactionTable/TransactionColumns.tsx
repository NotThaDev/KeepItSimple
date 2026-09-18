"use client";

import { Transaction } from "@/lib/models/Transaction";
import { createColumnHelper } from "@tanstack/react-table";
import { DeleteTransactionButton } from "./DeleteTransactionButton";
import { ENGLISH_DATE_FORMATTER } from "@/components/common/DateUtils";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { Pocket } from "@/lib/models/Pocket";
import { CategoryBadge } from "@/components/common/CategoryBadge";
import { Checkbox } from "@/components/ui/checkbox";
import { type DataTableFeatures } from "@/components/common/dataTable/DataTableFeatures";

interface TransactionColumnsProps {
  pockets: Pocket[];
  onEdit: (transaction: Transaction) => void;
}

const columnHelper = createColumnHelper<DataTableFeatures, Transaction>();

export function getTransactionDataColumns({
  pockets,
  onEdit,
}: Readonly<TransactionColumnsProps>) {
  return columnHelper.columns([
    columnHelper.display({
      id: "select",
      size: 1,
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    }),
    columnHelper.accessor("amount", {
      header: "Amount",
      cell: ({ getValue }) => {
        const amount = getValue();
        return `€${amount.toFixed(2)}`;
      },
    }),
    columnHelper.accessor("date", {
      header: "Date",
      cell: ({ getValue }) => {
        const date = getValue();
        return ENGLISH_DATE_FORMATTER.format(date);
      },
    }),
    columnHelper.accessor("category", {
      header: "Category",
      cell: ({ getValue }) => {
        return <CategoryBadge category={getValue()} />;
      },
    }),
    columnHelper.accessor("pocketId", {
      header: "Pocket",
      cell: ({ getValue }) => {
        const pocket = getValue();
        const pocketName = pockets.find((p: Pocket) => p.id === pocket)?.name;
        return <div className="capitalize">{pocketName}</div>;
      },
    }),
    columnHelper.accessor("description", {
      header: "Description",
      cell: ({ getValue }) => {
        const description = getValue();
        return (
          <div className="max-w-xs truncate text-ellipsis">
            {description || "-"}
          </div>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      size: 1,
      header: () => <div className="text-center">Actions</div>,
      cell: ({ row }) => {
        const transaction = row.original;

        return (
          <div className="flex gap-2 justify-center whitespace-nowrap">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(transaction)}
            >
              <Pencil />
            </Button>
            <DeleteTransactionButton transaction={transaction} />
          </div>
        );
      },
    }),
  ]);
}
