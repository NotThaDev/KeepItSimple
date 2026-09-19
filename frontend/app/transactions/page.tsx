import { PageWrapper } from "@/components/common/pageContainer/PageWrapper";
import { getRouteLabel } from "@/components/sidebar/RouteDefinition";
import {
  getTransactions,
  parseTransactionSearchParams,
} from "@/lib/models/Transaction";
import { TransactionPageContent } from "./TransactionPageContent";
import { getPockets } from "@/lib/models/Pocket";

export const metadata = {
  title: getRouteLabel("/transactions"),
};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseTransactionSearchParams(await searchParams);
  const [transactions, pockets] = await Promise.all([
    getTransactions(filters),
    getPockets(),
  ]);

  return (
    <PageWrapper title="Transactions">
      <TransactionPageContent
        transactionDataResponse={transactions}
        pockets={pockets}
        filters={filters}
      />
    </PageWrapper>
  );
}
