"use client";

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
import { createPocket, Pocket, updatePocket } from "@/lib/models/Pocket";
import { useCallback, useState } from "react";
import { toast } from "sonner";

interface PocketErrors {
  balance: boolean;
  currency: boolean;
  name: boolean;
  iban: boolean;
}

interface PocketFormData {
  id?: number;
  balance?: number;
  currency: string;
  name: string;
  iban: string;
}

interface PocketDrawerContentProps {
  pocket?: Pocket;
  onSave?: () => void;
}

function validateBalance(balance: number | undefined): boolean {
  return balance !== undefined && balance >= 0;
}

function validateCurrency(currency: string): boolean {
  return currency.length > 0 && currency.length <= 3;
}

export function PocketDrawerContent({
  pocket,
  onSave,
}: Readonly<PocketDrawerContentProps>) {
  const [pocketData, setPocketData] = useState<PocketFormData>(() =>
    pocket ? { ...pocket } : { currency: "EUR", name: "", iban: "" },
  );
  const [errors, setErrors] = useState<PocketErrors>({
    balance: false,
    currency: false,
    name: false,
    iban: false,
  });

  const handleSave = useCallback(async () => {
    const balanceValid = validateBalance(pocketData.balance);
    const currencyValid = validateCurrency(pocketData.currency);
    const nameValid = pocketData.name.trim().length > 0;
    const ibanValid = pocketData.iban.trim().length > 0;

    setErrors({
      balance: !balanceValid,
      currency: !currencyValid,
      name: !nameValid,
      iban: !ibanValid,
    });

    if (!balanceValid || !currencyValid || !nameValid || !ibanValid) {
      return;
    }

    const payload: Omit<Pocket, "id"> = {
      balance: pocketData.balance!,
      currency: pocketData.currency,
      name: pocketData.name,
      iban: pocketData.iban,
    };

    let error: string | undefined;

    if (!pocketData.id) {
      const createResponse = await createPocket(payload);
      error = createResponse.error;
    } else {
      const updateResponse = await updatePocket(pocketData.id, payload);
      error = updateResponse.error;
    }

    if (error) {
      toast.error(
        `Failed to ${pocketData.id ? "update" : "create"} pocket: ${error}`,
      );
      return;
    }

    toast.success(
      `Pocket ${pocketData.id ? "updated" : "created"} successfully!`,
    );
    onSave?.();
  }, [pocketData, onSave]);

  return (
    <DrawerContent>
      <DrawerHeader>
        <DrawerTitle>
          {pocketData.id ? "Edit Pocket" : "Create New Pocket"}
        </DrawerTitle>
        <DrawerDescription>
          {pocketData.id
            ? "Update your pocket details"
            : "Add a new pocket to track your money"}
        </DrawerDescription>
      </DrawerHeader>
      <FieldGroup className="space-y-3 p-5">
        <Field>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input
            id="name"
            type="text"
            placeholder="My Pocket"
            value={pocketData.name}
            onChange={(e) =>
              setPocketData({ ...pocketData, name: e.target.value })
            }
            aria-invalid={errors.name}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="balance">Balance</FieldLabel>
          <Input
            id="balance"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={pocketData.balance ?? ""}
            onChange={(e) =>
              setPocketData({
                ...pocketData,
                balance: e.target.value
                  ? parseFloat(e.target.value)
                  : undefined,
              })
            }
            aria-invalid={errors.balance}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="currency">Currency</FieldLabel>
          <Input
            id="currency"
            type="text"
            placeholder="EUR"
            maxLength={3}
            value={pocketData.currency}
            onChange={(e) =>
              setPocketData({
                ...pocketData,
                currency: e.target.value.toUpperCase(),
              })
            }
            aria-invalid={errors.currency}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="iban">IBAN</FieldLabel>
          <Input
            id="iban"
            type="text"
            placeholder="IT60 X054 2811 1010 0000 0123 456"
            value={pocketData.iban}
            onChange={(e) =>
              setPocketData({
                ...pocketData,
                iban: e.target.value.toUpperCase(),
              })
            }
            aria-invalid={errors.iban}
          />
        </Field>
      </FieldGroup>
      <DrawerFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <DrawerClose asChild>
          <Button variant="outline">Cancel</Button>
        </DrawerClose>
        <Button onClick={handleSave}>
          {pocketData.id ? "Update" : "Save"}
        </Button>
      </DrawerFooter>
    </DrawerContent>
  );
}
