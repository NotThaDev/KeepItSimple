"use client";

import { DataTable } from "@/components/common/dataTable/DataTable";
import { FetchWrapperResponse } from "@/lib/fetchWrapper";
import { Transaction } from "@/lib/models/Transaction";
import { toast } from "sonner";
import { transactionDataColumns } from "./transactionTable/TransactionColumns";
import { NewTransactionButton } from "./NewTransactionButton";

interface TransactionPageContentProps {
  transactionDataResponse: FetchWrapperResponse<Transaction[]>;
}

export function TransactionPageContent({
  transactionDataResponse,
}: Readonly<TransactionPageContentProps>) {
  if ("error" in transactionDataResponse) {
    toast.error("Failed to load transactions. Please try again later.");
  }

  const transactions = transactionDataResponse.data ?? [];
  return (
    <div className="flex flex-col gap-4 items-end">
      <DataTable
        className="min-h-[580]"
        columns={transactionDataColumns}
        data={transactions}
        initialState={{ pagination: { pageSize: 10 } }}
        extraContent={<NewTransactionButton />}
      />
    </div>
  );
}
