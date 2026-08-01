"use client";

import { Transaction } from "@/lib/models/Transaction";
import { ColumnDef } from "@tanstack/react-table";
import { DeleteTransactionButton } from "./DeleteTransactionButton";
import { ENGLISH_DATE_FORMATTER } from "@/components/common/DateUtils";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { Pocket } from "@/lib/models/Pocket";
import { Badge } from "@/components/ui/badge";
import {
  CategoryColorMap,
  DEFAULT_CATEGORY_COLORS,
} from "@/lib/helpers/colors";
import { Checkbox } from "@/components/ui/checkbox";

interface TransactionColumnsProps {
  pockets: Pocket[];
  onEdit: (transaction: Transaction) => void;
}

export function getTransactionDataColumns({
  pockets,
  onEdit,
}: Readonly<TransactionColumnsProps>): ColumnDef<Transaction>[] {
  return [
    {
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
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ getValue }) => {
        const amount = getValue() as number;
        return `€${amount.toFixed(2)}`;
      },
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ getValue }) => {
        const date = getValue() as Date;
        return ENGLISH_DATE_FORMATTER.format(date);
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ getValue }) => {
        const category = getValue() as string;
        const colors =
          CategoryColorMap[category as keyof typeof CategoryColorMap] ??
          DEFAULT_CATEGORY_COLORS;

        return (
          <Badge
            className="capitalize"
            variant="secondary"
            style={{
              backgroundColor: colors.foreground,
              color: colors.background,
            }}
          >
            {category}
          </Badge>
        );
      },
    },
    {
      accessorKey: "pocketId",
      header: "Pocket",
      cell: ({ getValue }) => {
        const pocket = getValue() as number;
        const pocketName = pockets.find((p: Pocket) => p.id === pocket)?.name;
        return <div className="capitalize">{pocketName}</div>;
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ getValue }) => {
        const description = getValue() as string | undefined;
        return (
          <div className="max-w-xs truncate text-ellipsis">
            {description || "-"}
          </div>
        );
      },
    },
    {
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
    },
  ];
}
