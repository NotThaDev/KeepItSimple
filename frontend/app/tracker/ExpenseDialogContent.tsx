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
  createExpense,
  Expense,
  ExpenseCategory,
  updateExpense,
} from "@/lib/models/Expense";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

interface ExpenseErrors {
  amount: boolean;
  category: boolean;
}

interface ExpenseFormData {
  id?: number;
  description?: string;
  amount?: number;
  date: Date;
  category?: ExpenseCategory;
}

interface ExpenseDialogProps {
  expense?: Expense;
  onSave?: () => void;
}

function validateAmount(amount: number | undefined): boolean {
  return amount !== undefined && amount > 0;
}

function validateCategory(category: ExpenseCategory | undefined): boolean {
  return category !== undefined;
}

export function ExpenseDialogContent({
  expense,
  onSave,
}: Readonly<ExpenseDialogProps>) {
  const [expenseData, setExpenseData] = useState<ExpenseFormData>(() =>
    expense ? { ...expense } : { date: new Date() },
  );
  const [errors, setErrors] = useState<ExpenseErrors>({
    amount: false,
    category: false,
  });

  const selectionItems = useMemo(() => {
    return Object.values(ExpenseCategory).map((category) => ({
      value: ExpenseCategory[category],
      label: category,
    }));
  }, []);

  const handleSave = useCallback(async () => {
    const amountValid = validateAmount(expenseData.amount);
    const categoryValid = validateCategory(expenseData.category);

    setErrors({
      amount: !amountValid,
      category: !categoryValid,
    });

    if (!amountValid || !categoryValid) {
      return;
    }

    const payload: Omit<Expense, "id"> = {
      amount: expenseData.amount!,
      category: expenseData.category!,
      date: expenseData.date,
      description: expenseData.description,
    };
    let error: string | undefined;

    if (!expenseData.id) {
      const createResponse = await createExpense(payload);
      error = createResponse.error;
    } else {
      const updateResponse = await updateExpense(expenseData.id, {
        id: expenseData.id,
        ...payload,
      });
      error = updateResponse.error;
    }

    if (error) {
      toast.error("Failed to save expense. Please try again.");
      return;
    }

    toast.success(
      `Expense ${expense?.id ? "updated" : "created"} successfully`,
    );
    onSave?.();
  }, [expense, expenseData, onSave]);

  const title = expense ? "Edit Expense" : "New Expense";
  return (
    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle>{title}</DrawerTitle>
        <DrawerDescription>
          {expense
            ? "Modify the details of your expense below."
            : "Fill in the details of your new expense below."}
        </DrawerDescription>
      </DrawerHeader>
      <FieldGroup className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 p-5">
        <Field>
          <FieldLabel className="">Expense Date</FieldLabel>
          <DatePicker
            defaultDate={expenseData.date}
            onDateChange={(date) =>
              setExpenseData((prev) => ({ ...prev, date }))
            }
          />
        </Field>
        <Field data-invalid={errors.amount}>
          <FieldLabel>Amount</FieldLabel>
          <Input
            type="number"
            aria-invalid={errors.amount}
            defaultValue={expenseData.amount}
            onChange={(e) => {
              const amount = parseFloat(e.target.value);
              if (isNaN(amount)) {
                setErrors((prev) => ({ ...prev, amount: true }));
                return;
              }
              setExpenseData((prev) => ({ ...prev, amount }));
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
            defaultValue={expenseData.category}
            placeholder="Select a Category"
            isInvalid={errors.category}
            onChange={(value) => {
              const category = value as ExpenseCategory;
              setExpenseData((prev) => ({ ...prev, category }));
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
            defaultValue={expenseData.description}
            onChange={(e) =>
              setExpenseData((prev) => ({
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
