"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Pocket } from "@/lib/models/Pocket";
import { Wallet } from "lucide-react";
import { EditPocketButton } from "./pocketTable/EditPocketButton";
import { DeletePocketButton } from "./pocketTable/DeletePocketButton";
import { getCurrencySymbolFromCode } from "@/lib/helpers/currencyHelper";

interface PocketCardProps {
  pocket: Pocket;
}

export function PocketCard({ pocket }: Readonly<PocketCardProps>) {
  return (
    <Card className="relative overflow-hidden cursor-default h-[250px]">
      <CardHeader className="relative pb-2">
        <div className="flex items-start justify-between align-center">
          <CardTitle className="text-lg font-semibold">
            {pocket.name || "Pocket"}
          </CardTitle>
          <div className="rounded-lg bg-primary/10 p-2">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative py-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Balance</p>
          <p className="text-3xl font-bold tracking-tight">
            {pocket.balance.toFixed(2)}{" "}
            {getCurrencySymbolFromCode(pocket.currency)}
          </p>
          {pocket.iban && (
            <p className="text-xs text-muted-foreground font-mono truncate mt-1">
              {pocket.iban}
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="relative flex gap-2 pt-2">
        <EditPocketButton pocket={pocket} />
        <DeletePocketButton pocketId={pocket.id} />
      </CardFooter>
    </Card>
  );
}
