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
import {
  createTransaction,
  Transaction,
  TransactionCategory,
  updateTransaction,
} from "@/lib/models/Expense";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

interface TransactionErrors {
  amount: boolean;
  category: boolean;
}

interface TransactionFormData {
  id?: number;
  description?: string;
  amount?: number;
  date: Date;
  category?: TransactionCategory;
}

interface TransactionDrawerContentProps {
  transaction?: Transaction;
  onSave?: () => void;
}

function validateAmount(amount: number | undefined): boolean {
  return amount !== undefined && amount > 0;
}

function validateCategory(category: TransactionCategory | undefined): boolean {
  return category !== undefined;
}

export function TransactionDrawerContent({
  transaction,
  onSave,
}: Readonly<TransactionDrawerContentProps>) {
  const [transactionData, setTransactionData] = useState<TransactionFormData>(
    () => (transaction ? { ...transaction } : { date: new Date() }),
  );
  const [errors, setErrors] = useState<TransactionErrors>({
    amount: false,
    category: false,
  });

  const selectionItems = useMemo(() => {
    return Object.values(TransactionCategory).map((category) => ({
      value: TransactionCategory[category],
      label: category,
    }));
  }, []);

  const handleSave = useCallback(async () => {
    const amountValid = validateAmount(transactionData.amount);
    const categoryValid = validateCategory(transactionData.category);

    setErrors({
      amount: !amountValid,
      category: !categoryValid,
    });

    if (!amountValid || !categoryValid) {
      return;
    }

    const payload: Omit<Transaction, "id"> = {
      amount: transactionData.amount!,
      category: transactionData.category!,
      date: transactionData.date,
      description: transactionData.description,
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
  }, [transactionData, onSave]);

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

        <Field className="sm:col-span-2" data-invalid={errors.category}>
          <FieldLabel>Category</FieldLabel>
          <Selection
            items={selectionItems}
            defaultValue={transactionData.category}
            placeholder="Select a Category"
            isInvalid={errors.category}
            onChange={(value) => {
              const category = value as TransactionCategory;
              setTransactionData((prev) => ({ ...prev, category }));
              setErrors((prev) => ({
                ...prev,
                category: !validateCategory(category),
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
