"use client";

import { Expense } from "@/lib/models/Expense";
import { ColumnDef } from "@tanstack/react-table";
import { EditTransactionButton } from "./EditTransactionButton";
import { DeleteTransactionButton } from "./DeleteTransactionButton";

export const expenseColumns: ColumnDef<Expense>[] = [
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ getValue }) => {
      const date = getValue() as Date;
      return date.toLocaleDateString();
    },
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "amount",
    header: "Amount",
  },
  {
    id: "actions",
    size: 1,
    header: () => <div className="text-center">Actions</div>,
    cell: ({ row }) => {
      const transaction = row.original;

      return (
        <div className="flex gap-2 justify-center whitespace-nowrap">
          <EditTransactionButton transaction={transaction} />
          <DeleteTransactionButton transaction={transaction} />
        </div>
      );
    },
  },
];
