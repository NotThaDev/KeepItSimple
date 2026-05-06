import { PageWrapper } from "@/components/common/pageContainer/PageWrapper";
import { getTransactions } from "@/lib/models/Transaction";
import { TransactionPageContent } from "./TransactionPageContent";

export default async function TransactionsPage() {
  const transactions = await getTransactions();

  return (
    <PageWrapper title="Transactions">
      <TransactionPageContent transactionDataResponse={transactions} />
    </PageWrapper>
  );
}
