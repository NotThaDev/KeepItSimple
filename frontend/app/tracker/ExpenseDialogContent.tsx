"use client";

import { DatePicker } from "@/components/common/DatePicker";
import { Selection } from "@/components/common/selector/Selection";
import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          {expense
            ? "Modify the details of your expense below."
            : "Fill in the details of your new expense below."}
        </DialogDescription>
      </DialogHeader>
      <FieldGroup className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      </FieldGroup>
      <div className="flex flex-row items-center gap-3 mt-3">
        {/* <DatePicker
          defaultDate={expenseData?.date ?? new Date()}
          onDateChange={(date) =>
            setExpenseData((prev) => (prev ? { ...prev, date } : prev))
          }
          helperText="Expense Date"
        /> */}
        {/* <div className="flex flex-col gap-1">
          <Label className="text-xs font-normal ms-1 text-muted-foreground">
            Amount
          </Label>
          <Input
            type="number"
            defaultValue={expenseData?.amount}
            onChange={(e) => {
              const amount = parseFloat(e.target.value);
              if (isNaN(amount)) {
                return;
              }
              setExpenseData((prev) => (prev ? { ...prev, amount } : prev));
            }}
          />
        </div> */}
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button onClick={handleSave}>Save</Button>
      </DialogFooter>
    </DialogContent>
  );
}
