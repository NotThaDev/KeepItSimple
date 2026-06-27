"use client";

import { DatePicker } from "@/components/common/DatePicker";
import { Selection } from "@/components/common/selector/Selection";
import { Button } from "@/components/ui/button";
import {
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Pocket } from "@/lib/models/Pocket";
import {
  createTransaction,
  EXPENSE_TRANSACTION_CATEGORIES,
  INCOME_TRANSACTION_CATEGORIES,
  Transaction,
  TransactionCategory,
  updateTransaction,
} from "@/lib/models/Transaction";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

interface TransactionErrors {
  amount: boolean;
  category: boolean;
  pocketId: boolean;
}

interface TransactionFormData {
  id?: number;
  description?: string;
  amount?: number;
  date: Date;
  pocketId: number;
  category?: TransactionCategory;
}

interface TransactionDrawerContentProps {
  transaction?: Transaction;
  pockets: Pocket[];
  onSave?: () => void;
}

function validateAmount(amount: number | undefined): boolean {
  return amount !== undefined && amount > 0;
}

function getInitialTransactionData(
  transaction: Transaction | undefined,
  pockets: Pocket[],
): TransactionFormData {
  if (!transaction) {
    return { date: new Date(), pocketId: pockets[0]?.id ?? 0 };
  }

  return { ...transaction, amount: Math.abs(transaction.amount) };
}

enum TransactionType {
  Income = "income",
  Expense = "expense",
}

function formatCategoryLabel(category: TransactionCategory): string {
  return category.replace(/([A-Z])/g, " $1").trim();
}

export function TransactionDrawerContent({
  transaction,
  pockets,
  onSave,
}: Readonly<TransactionDrawerContentProps>) {
  const [transactionType, setTransactionType] = useState<TransactionType>(
    transaction?.amount && transaction.amount > 0
      ? TransactionType.Income
      : TransactionType.Expense,
  );
  const [transactionData, setTransactionData] = useState<TransactionFormData>(
    () => getInitialTransactionData(transaction, pockets),
  );
  const [errors, setErrors] = useState<TransactionErrors>({
    amount: false,
    category: false,
    pocketId: false,
  });

  const availableCategories = useMemo(
    () =>
      transactionType === TransactionType.Income
        ? INCOME_TRANSACTION_CATEGORIES
        : EXPENSE_TRANSACTION_CATEGORIES,
    [transactionType],
  );

  const selectionItems = useMemo(
    () =>
      availableCategories.map((category) => ({
        value: category,
        label: formatCategoryLabel(category),
      })),
    [availableCategories],
  );

  const selectedCategory = useMemo(() => {
    if (
      transactionData.category &&
      availableCategories.includes(transactionData.category)
    ) {
      return transactionData.category;
    }

    return availableCategories[0];
  }, [transactionData.category, availableCategories]);

  const pocketsSelectionItems = useMemo(() => {
    return pockets.map((pocket) => ({
      value: pocket.id.toString(),
      label: pocket.name,
    }));
  }, [pockets]);

  const handleSave = useCallback(async () => {
    const amountValid = validateAmount(transactionData.amount);
    const categoryValid = selectedCategory !== undefined;
    const pocketIdValid = transactionData.pocketId !== undefined;

    setErrors({
      amount: !amountValid,
      category: !categoryValid,
      pocketId: !pocketIdValid,
    });

    if (!amountValid || !categoryValid || !pocketIdValid) {
      return;
    }

    let amount = transactionData.amount!;

    if (transactionType === TransactionType.Expense) {
      amount = -Math.abs(amount);
    } else {
      amount = Math.abs(amount);
    }

    const payload: Omit<Transaction, "id"> = {
      amount: amount,
      category: selectedCategory!,
      date: transactionData.date,
      description: transactionData.description,
      pocketId: transactionData.pocketId,
    };
    let error: string | undefined;

    if (!transactionData.id) {
      const createResponse = await createTransaction(payload);
      error = createResponse.error;
    } else {
      const updateResponse = await updateTransaction(transactionData.id, {
        id: transactionData.id,
        ...payload,
      });
      error = updateResponse.error;
    }

    if (error) {
      toast.error("Failed to save transaction. Please try again.");
      return;
    }

    toast.success(
      `Transaction ${transactionData.id ? "updated" : "created"} successfully`,
    );
    onSave?.();
  }, [transactionData, transactionType, selectedCategory, onSave]);

  const title = transactionData.id ? "Edit Transaction" : "New Transaction";
  return (
    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle>{title}</DrawerTitle>
        <DrawerDescription>
          {transactionData.id
            ? "Modify the details of your transaction below."
            : "Fill in the details of your new transaction below."}
        </DrawerDescription>
      </DrawerHeader>

      <FieldGroup className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 p-5">
        <Field>
          <FieldLabel className="">Transaction Date</FieldLabel>
          <DatePicker
            defaultDate={transactionData.date}
            onDateChange={(date) =>
              setTransactionData((prev) => ({ ...prev, date }))
            }
          />
        </Field>

        <Field data-invalid={errors.amount}>
          <FieldLabel>Amount</FieldLabel>
          <Input
            type="number"
            aria-invalid={errors.amount}
            defaultValue={transactionData.amount}
            onChange={(e) => {
              const amount = parseFloat(e.target.value);
              if (isNaN(amount)) {
                setErrors((prev) => ({ ...prev, amount: true }));
                return;
              }
              setTransactionData((prev) => ({ ...prev, amount }));
              setErrors((prev) => ({
                ...prev,
                amount: !validateAmount(amount),
              }));
            }}
          />
        </Field>

        <Field className="sm:col-span-2" data-invalid={errors.pocketId}>
          <FieldLabel>Pocket</FieldLabel>
          <Selection
            items={pocketsSelectionItems}
            defaultValue={
              transactionData.pocketId?.toString() ??
              pocketsSelectionItems[0]?.value
            }
            placeholder="Select a Pocket"
            onChange={(value) => {
              const pocketId = Number(value);
              setTransactionData((prev) => ({ ...prev, pocketId }));
              setErrors((prev) => ({
                ...prev,
                pocketId: pocketId === undefined,
              }));
            }}
          />
        </Field>

        <Field className="sm:col-span-2" data-invalid={errors.category}>
          <FieldLabel>Category</FieldLabel>
          <Selection
            key={transactionType}
            items={selectionItems}
            defaultValue={selectedCategory}
            placeholder="Select a Category"
            isInvalid={errors.category}
            onChange={(value) => {
              const category = value as TransactionCategory;
              setTransactionData((prev) => ({ ...prev, category }));
              setErrors((prev) => ({
                ...prev,
                category: category === undefined,
              }));
            }}
          />
        </Field>

        <Field className="sm:col-span-2">
          <FieldLabel>Description</FieldLabel>
          <Textarea
            rows={6}
            placeholder="Add an optional description..."
            defaultValue={transactionData.description}
            onChange={(e) =>
              setTransactionData((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
          />
        </Field>

        <ToggleGroup
          type="single"
          className="w-full sm:col-span-2"
          value={transactionType}
          onValueChange={(value) => {
            if (!value) return;
            setTransactionType(value as TransactionType);
          }}
        >
          <ToggleGroupItem
            value={TransactionType.Income}
            className="flex-1 border border-gray-700 border-r-0 text-gray-700 transition-all hover:bg-emerald-50 hover:text-emerald-700 data-[state=on]:bg-gradient-to-b data-[state=on]:from-emerald-100 data-[state=on]:to-emerald-50 data-[state=on]:text-emerald-800 data-[state=on]:shadow-[inset_0_0_0_1px_rgba(16,185,129,0.35)] dark:border-gray-700 dark:text-gray-200 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-200 dark:data-[state=on]:from-emerald-900/55 dark:data-[state=on]:to-emerald-900/25 dark:data-[state=on]:text-emerald-200"
          >
            Income
          </ToggleGroupItem>
          <ToggleGroupItem
            value={TransactionType.Expense}
            className="flex-1 border border-gray-700 text-gray-700 transition-all hover:bg-rose-50 hover:text-rose-700 data-[state=on]:bg-gradient-to-b data-[state=on]:from-rose-100 data-[state=on]:to-rose-50 data-[state=on]:text-rose-800 data-[state=on]:shadow-[inset_0_0_0_1px_rgba(244,63,94,0.35)] dark:border-gray-700 dark:text-gray-200 dark:hover:bg-rose-900/30 dark:hover:text-rose-200 dark:data-[state=on]:from-rose-900/55 dark:data-[state=on]:to-rose-900/25 dark:data-[state=on]:text-rose-200"
          >
            Expense
          </ToggleGroupItem>
        </ToggleGroup>
      </FieldGroup>
      <DrawerFooter className="flex-row justify-end">
        <DrawerClose asChild className="w-[108px]">
          <Button variant="outline">Cancel</Button>
        </DrawerClose>
        <Button onClick={handleSave} className="w-[108px]">
          Save
        </Button>
      </DrawerFooter>
    </DrawerContent>
  );
}
