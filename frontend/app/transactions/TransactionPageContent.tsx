"use client";

import { DataTable } from "@/components/common/dataTable/DataTable";
import { FetchWrapperResponse } from "@/lib/fetchWrapper";
import {
  DEFAULT_TRANSACTION_PAGE_SIZE,
  deleteTransactions,
  PagedTransactions,
  toTransactionSearchParams,
  Transaction,
  TransactionListQuery,
} from "@/lib/models/Transaction";
import { toast } from "sonner";
import { getTransactionDataColumns } from "./transactionTable/TransactionColumns";
import { Pocket } from "@/lib/models/Pocket";
import { useCallback, useMemo, useState } from "react";
import { EmptyStateCard } from "@/components/common/emptyState/EmptyStateCard";
import { TransactionDrawerContent } from "./TransactionDrawerContent";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, WalletCards } from "lucide-react";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";
import { usePathname, useRouter } from "next/navigation";
import { ConfirmationDialogContent } from "@/components/common/ConfirmationDialogContent";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { TransactionFilters } from "./TransactionFilters";

const OPEN_NEW_POCKET_DRAWER_KEY = "kis:open-new-pocket-drawer";

interface TransactionPageContentProps {
  transactionDataResponse: FetchWrapperResponse<PagedTransactions>;
  pockets: FetchWrapperResponse<Pocket[]>;
  filters: TransactionListQuery;
}

export function TransactionPageContent({
  transactionDataResponse,
  pockets,
  filters,
}: Readonly<TransactionPageContentProps>) {
  const router = useRouter();
  const pathname = usePathname();

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

  const applyFilters = useCallback(
    (patch: Partial<TransactionListQuery>) => {
      const nextFilters: TransactionListQuery = {
        ...filters,
        ...patch,
      };
      const queryString = toTransactionSearchParams(nextFilters);
      router.replace(queryString ? `${pathname}?${queryString}` : pathname);
    },
    [filters, pathname, router],
  );

  const handleFilterChange = useCallback(
    (patch: Partial<TransactionListQuery>) => {
      applyFilters({ ...patch, page: 1 });
    },
    [applyFilters],
  );

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

  const pocketsData = useMemo(() => pockets.data ?? [], [pockets.data]);
  const pagedTransactions = transactionDataResponse.data;
  const transactions = useMemo(
    () => pagedTransactions?.items ?? [],
    [pagedTransactions?.items],
  );
  const totalCount = pagedTransactions?.totalCount ?? 0;
  const pageSize = pagedTransactions?.pageSize ?? DEFAULT_TRANSACTION_PAGE_SIZE;
  const pageCount = Math.ceil(totalCount / pageSize);

  const content = useMemo(() => {
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

    return (
      <>
        <TransactionFilters
          pockets={pocketsData}
          filters={filters}
          onChange={handleFilterChange}
        />
        <DataTable
          key={selectionResetTrigger}
          onRowSelectionChange={setSelectedRows}
          className="min-h-[580px]"
          columns={transactionDataColumns}
          data={transactions}
          pageCount={pageCount}
          pageIndex={Math.max(filters.page - 1, 0)}
          onPageChange={(pageIndex) => applyFilters({ page: pageIndex + 1 })}
          initialState={{ pagination: { pageSize } }}
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
    applyFilters,
    deleteTransactionOpen,
    filters,
    handleFilterChange,
    onDeleteSelected,
    pageCount,
    pageSize,
    pocketsData,
    router,
    selectedRows,
    selectionResetTrigger,
    transactionDataColumns,
    transactions,
  ]);

  return (
    <div
      className={`flex w-full flex-col gap-4 ${pocketsData.length === 0 ? "items-center" : "items-stretch"}`}
    >
      <Drawer
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
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
