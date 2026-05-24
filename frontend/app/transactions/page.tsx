import { PageWrapper } from "@/components/common/pageContainer/PageWrapper";
import { getTransactions } from "@/lib/models/Transaction";
import { TransactionPageContent } from "./TransactionPageContent";
import { getPockets } from "@/lib/models/Pocket";

export default async function TransactionsPage() {
  const transactions = await getTransactions();
  const pockets = await getPockets();

  return (
    <PageWrapper title="Transactions">
      <TransactionPageContent
        transactionDataResponse={transactions}
        pockets={pockets}
      />
    </PageWrapper>
  );
}
