"use client";

import { Expense } from "@/lib/models/Expense";
import { ColumnDef } from "@tanstack/react-table";

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
];
