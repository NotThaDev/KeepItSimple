"use client";

import { DataTable } from "@/components/common/dataTable/DataTable";
import { FetchWrapperResponse } from "@/lib/fetchWrapper";
import { Transaction } from "@/lib/models/Transaction";
import { toast } from "sonner";
import { getTransactionDataColumns } from "./transactionTable/TransactionColumns";
import { Pocket } from "@/lib/models/Pocket";
import { useCallback, useMemo, useState } from "react";
import { EmptyStateCard } from "@/components/common/emptyState/EmptyStateCard";
import { TransactionDrawerContent } from "./TransactionDrawerContent";
import { Button } from "@/components/ui/button";
import { HandCoins, Plus, WalletCards } from "lucide-react";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";
import { useRouter } from "next/navigation";

const OPEN_NEW_POCKET_DRAWER_KEY = "kis:open-new-pocket-drawer";

interface TransactionPageContentProps {
  transactionDataResponse: FetchWrapperResponse<Transaction[]>;
  pockets: FetchWrapperResponse<Pocket[]>;
}

export function TransactionPageContent({
  transactionDataResponse,
  pockets,
}: Readonly<TransactionPageContentProps>) {
  const router = useRouter();

  if ("error" in transactionDataResponse || "error" in pockets) {
    toast.error("Failed to load transactions. Please try again later.");
  }

  const [open, setOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<
    Transaction | undefined
  >(undefined);

  const handleSave = useCallback(() => {
    setOpen(false);
    setSelectedTransaction(undefined);
    router.refresh();
  }, [router]);

  const handleEditTransaction = useCallback((transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setOpen(true);
  }, []);

  const transactionDataColumns = useMemo(
    () => getTransactionDataColumns({ onEdit: handleEditTransaction }),
    [handleEditTransaction],
  );

  const content = useMemo(() => {
    const transactions = transactionDataResponse.data ?? [];
    const pocketsData = pockets.data ?? [];

    if (pocketsData.length === 0) {
      return (
        <EmptyStateCard
          title="No pockets yet"
          description="You need to create a pocket before adding transactions."
          actionText="Create Pocket"
          onAction={() => {
            sessionStorage.setItem(OPEN_NEW_POCKET_DRAWER_KEY, true.toString());
            router.push("/pockets");
          }}
          icon={WalletCards}
        />
      );
    }

    if (transactions.length === 0) {
      return (
        <>
          <EmptyStateCard
            title="No transactions yet"
            description="Start by creating a new transaction to keep track of your expenses and income."
            actionText="Create Transaction"
            onAction={() => {
              setSelectedTransaction(undefined);
              setOpen(true);
            }}
            icon={HandCoins}
          />
        </>
      );
    }

    return (
      <>
        <DataTable
          className="min-h-[580px]"
          columns={transactionDataColumns}
          data={transactions}
          initialState={{ pagination: { pageSize: 10 } }}
          extraContent={
            <DrawerTrigger asChild>
              <Button
                size="lg"
                className="w-[fit-content]"
                onClick={() => setSelectedTransaction(undefined)}
              >
                <Plus />
                New Transaction
              </Button>
            </DrawerTrigger>
          }
        />
      </>
    );
  }, [
    transactionDataColumns,
    transactionDataResponse.data,
    pockets.data,
    router,
  ]);

  const isEmptyState = useMemo(() => {
    const transactions = transactionDataResponse.data ?? [];
    const pocketsData = pockets.data ?? [];
    return transactions.length === 0 || pocketsData.length === 0;
  }, [transactionDataResponse.data, pockets.data]);

  return (
    <div
      className={`flex flex-col gap-4 ${isEmptyState ? "items-center" : "items-end"}`}
    >
      <Drawer
        open={open}
        onOpenChange={(open) => {
          setOpen(open);
          if (!open) {
            setSelectedTransaction(undefined);
          }
        }}
        direction="right"
      >
        <TransactionDrawerContent
          key={`${selectedTransaction?.id ?? "new"}-${open ? "open" : "closed"}`}
          onSave={handleSave}
          transaction={selectedTransaction}
          pockets={pockets.data ?? []}
        />
        {content}
      </Drawer>
    </div>
  );
}
