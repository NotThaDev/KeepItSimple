"use client";

import { DataTable } from "@/components/common/dataTable/DataTable";
import { FetchWrapperResponse } from "@/lib/fetchWrapper";
import { deleteTransactions, Transaction } from "@/lib/models/Transaction";
import { toast } from "sonner";
import { getTransactionDataColumns } from "./transactionTable/TransactionColumns";
import { Pocket } from "@/lib/models/Pocket";
import { useCallback, useMemo, useState } from "react";
import { EmptyStateCard } from "@/components/common/emptyState/EmptyStateCard";
import { TransactionDrawerContent } from "./TransactionDrawerContent";
import { Button } from "@/components/ui/button";
import { HandCoins, Plus, Trash2, WalletCards } from "lucide-react";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";
import { useRouter } from "next/navigation";
import { ConfirmationDialogContent } from "@/components/common/ConfirmationDialogContent";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";

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
  const [deleteTransactionOpen, setDeleteTransactionOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Transaction[]>([]);
  const [selectionResetTrigger, setSelectionResetTrigger] = useState(0);
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

  const onDeleteSelected = useCallback(
    async (selectedTransactions: Transaction[]) => {
      if (selectedTransactions.length === 0) {
        return;
      }

      const idsToDelete = selectedTransactions
        .map((transaction) => transaction.id)
        .filter(Boolean) as number[];

      const result = await deleteTransactions(idsToDelete);
      if ("error" in result) {
        toast.error("Failed to delete transactions. Please try again later.");
      } else {
        toast.success("Transactions deleted successfully.");
        setSelectedRows([]);
        setSelectionResetTrigger((current) => current + 1);
        router.refresh();
      }

      setDeleteTransactionOpen(false);
    },
    [router],
  );

  const transactionDataColumns = useMemo(
    () =>
      getTransactionDataColumns({
        onEdit: handleEditTransaction,
        pockets: pockets.data ?? [],
      }),
    [handleEditTransaction, pockets.data],
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
          onRowSelectionChange={setSelectedRows}
          resetSelectionTrigger={selectionResetTrigger}
          className="min-h-[580px]"
          columns={transactionDataColumns}
          data={transactions}
          initialState={{ pagination: { pageSize: 10 } }}
          extraContent={
            <div className="flex gap-2 items-center">
              <Dialog
                open={deleteTransactionOpen}
                onOpenChange={setDeleteTransactionOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    variant="destructive"
                    className="w-[fit-content]"
                    disabled={selectedRows.length === 0}
                  >
                    <Trash2 />
                    Delete Selected
                  </Button>
                </DialogTrigger>

                <ConfirmationDialogContent
                  title={`Delete ${selectedRows.length} Transaction${selectedRows.length > 1 ? "s" : ""}`}
                  description="Are you sure you want to delete this transaction? This action cannot be undone."
                  onConfirm={() => onDeleteSelected(selectedRows)}
                  onCancel={() => setDeleteTransactionOpen(false)}
                  confirmButtonVariant="destructive"
                />
              </Dialog>
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
            </div>
          }
        />
      </>
    );
  }, [
    transactionDataResponse.data,
    pockets.data,
    selectionResetTrigger,
    transactionDataColumns,
    deleteTransactionOpen,
    selectedRows,
    router,
    onDeleteSelected,
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
