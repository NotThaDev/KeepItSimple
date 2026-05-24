import { ENGLISH_DATE_FORMATTER } from "@/components/common/DateUtils";
import { EmptyStateCard } from "@/components/common/emptyState/EmptyStateCard";
import { PageWrapper } from "@/components/common/pageContainer/PageWrapper";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrencySymbolFromCode } from "@/lib/helpers/currencyHelper";
import { getPockets } from "@/lib/models/Pocket";
import { getTransactions } from "@/lib/models/Transaction";
import {
  Activity,
  ArrowRight,
  Coins,
  ReceiptText,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

interface DashboardStatCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
}

function DashboardStatCard({
  title,
  value,
  description,
  icon: Icon,
}: Readonly<DashboardStatCardProps>) {
  return (
    <Card className="min-h-40">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardDescription>{title}</CardDescription>
          <CardTitle className="text-2xl">{value}</CardTitle>
        </div>
        <div className="rounded-lg bg-primary/10 p-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const [pocketsResponse, transactionsResponse] = await Promise.all([
    getPockets(),
    getTransactions(),
  ]);

  const pockets = pocketsResponse.data ?? [];
  const transactions = [...(transactionsResponse.data ?? [])].sort(
    (left, right) => right.date.getTime() - left.date.getTime(),
  );

  const pocketById = new Map(pockets.map((pocket) => [pocket.id, pocket]));
  const trackedCurrencies = new Set(pockets.map((pocket) => pocket.currency)).size;
  const latestTransaction = transactions[0];
  const topCategoryEntry = Object.entries(
    transactions.reduce<Record<string, number>>((categories, transaction) => {
      categories[transaction.category] =
        (categories[transaction.category] ?? 0) + 1;
      return categories;
    }, {}),
  ).sort((left, right) => right[1] - left[1])[0];
  const hasDataLoadError =
    "error" in pocketsResponse || "error" in transactionsResponse;

  return (
    <PageWrapper
      title="Dashboard"
      extraContent={
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="lg">
            <Link href="/pockets">Manage Pockets</Link>
          </Button>
          <Button asChild size="lg">
            <Link href="/transactions">View Transactions</Link>
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6 pb-6">
        {hasDataLoadError && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader>
              <CardTitle>Some dashboard data could not be loaded</CardTitle>
              <CardDescription>
                The latest data is partially unavailable right now. You can still
                navigate to the pockets and transactions pages to try again.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {pockets.length === 0 ? (
          <EmptyStateCard
            title="No pockets yet"
            description="Create your first pocket to start tracking balances and transactions from the dashboard."
            actionText="Create Pocket"
            actionHref="/pockets"
            icon={WalletCards}
            className="max-w-2xl"
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <DashboardStatCard
                title="Active pockets"
                value={pockets.length.toString()}
                description="Keep an eye on all of your available pockets from one place."
                icon={WalletCards}
              />
              <DashboardStatCard
                title="Tracked currencies"
                value={trackedCurrencies.toString()}
                description="See how many currencies are currently represented across your pockets."
                icon={Coins}
              />
              <DashboardStatCard
                title="Transactions logged"
                value={transactions.length.toString()}
                description="Every transaction you add contributes to your overall portfolio history."
                icon={ReceiptText}
              />
              <DashboardStatCard
                title="Top category"
                value={topCategoryEntry?.[0] ?? "No activity yet"}
                description={
                  topCategoryEntry
                    ? `${topCategoryEntry[1]} transaction${topCategoryEntry[1] === 1 ? "" : "s"} recorded in this category.`
                    : "Add transactions to start surfacing spending trends."
                }
                icon={Activity}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <Card className="min-h-[420px]">
                <CardHeader>
                  <CardTitle>Recent transactions</CardTitle>
                  <CardDescription>
                    Review the latest activity recorded across all of your pockets.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {latestTransaction ? (
                    transactions.slice(0, 5).map((transaction) => {
                      const pocket = pocketById.get(transaction.pocketId);

                      return (
                        <div
                          key={transaction.id}
                          className="flex flex-col gap-3 rounded-lg border border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="space-y-1">
                            <p className="font-medium">
                              {transaction.description || transaction.category}
                            </p>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                              <span>{transaction.category}</span>
                              <span>
                                {ENGLISH_DATE_FORMATTER.format(transaction.date)}
                              </span>
                              <span>{pocket?.name ?? "Unknown pocket"}</span>
                            </div>
                          </div>
                          <p className="text-lg font-semibold">
                            {transaction.amount.toFixed(2)}{" "}
                            {pocket
                              ? getCurrencySymbolFromCode(pocket.currency)
                              : "€"}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex h-full min-h-72 flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 text-center">
                      <ReceiptText className="h-8 w-8 text-muted-foreground" />
                      <div className="space-y-1">
                        <p className="font-medium">No transactions yet</p>
                        <p className="text-sm text-muted-foreground">
                          Start logging transactions to build your activity feed.
                        </p>
                      </div>
                      <Button asChild variant="outline">
                        <Link href="/transactions">Create Transaction</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="min-h-[420px]">
                <CardHeader>
                  <CardTitle>Pocket balances</CardTitle>
                  <CardDescription>
                    Check the current balance and details for each tracked pocket.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {pockets.map((pocket) => (
                    <div
                      key={pocket.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border/70 p-4"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{pocket.name}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                          <span>{pocket.currency}</span>
                          {pocket.iban && (
                            <span className="font-mono">{pocket.iban}</span>
                          )}
                        </div>
                      </div>
                      <p className="text-lg font-semibold whitespace-nowrap">
                        {pocket.balance.toFixed(2)}{" "}
                        {getCurrencySymbolFromCode(pocket.currency)}
                      </p>
                    </div>
                  ))}

                  <Button asChild variant="ghost" className="self-start">
                    <Link href="/pockets">
                      View all pockets
                      <ArrowRight />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </PageWrapper>
  );
}
