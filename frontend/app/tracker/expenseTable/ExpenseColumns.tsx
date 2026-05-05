"use client";

import { Expense } from "@/lib/models/Expense";
import { ColumnDef } from "@tanstack/react-table";
import { EditTransactionButton } from "./EditTransactionButton";
import { DeleteTransactionButton } from "./DeleteTransactionButton";
import { ENGLISH_DATE_FORMATTER } from "@/components/common/DateUtils";

export const expenseColumns: ColumnDef<Expense>[] = [
  // #TODO Add the transaction to the model of the transaction. (e.g Spotify, Amazon, etc)
  // {
  //   accessorKey: "transaction",
  //   header: "Transaction",
  // },
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
          <EditTransactionButton transaction={transaction} />
          <DeleteTransactionButton transaction={transaction} />
        </div>
      );
    },
  },
];
