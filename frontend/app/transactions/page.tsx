import { PageWrapper } from "@/components/common/pageContainer/PageWrapper";
import { NewTransactionButton } from "@/app/transactions/NewTransactionButton";
import { getTransactions } from "@/lib/models/Expense";
import { transactionDataColumns } from "./transactionTable/TransactionColumns";
import { DataTable } from "@/components/common/dataTable/DataTable";
import { toast } from "sonner";

export default async function TransactionsPage() {
  const transactions = await getTransactions();

  if ("error" in transactions) {
    toast.error("Failed to load transactions. Please try again later.");
    return (
      <PageWrapper title="Tracker" extraContent={<NewTransactionButton />}>
        <div className="text-center text-muted-foreground">
          Failed to load transactions. Please try again later.
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Transactions">
      <div className="flex flex-col gap-4 items-end">
        <DataTable
          className="min-h-[580]"
          columns={transactionDataColumns}
          data={transactions.data ?? []}
          initialState={{ pagination: { pageSize: 10 } }}
          extraContent={<NewTransactionButton />}
        />
      </div>
    </PageWrapper>
  );
}
