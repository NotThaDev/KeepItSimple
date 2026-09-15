"use client";

import { Selection } from "@/components/common/selector/Selection";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CategoryColorMap,
  DEFAULT_CATEGORY_COLORS,
} from "@/lib/helpers/colors";
import { Pocket } from "@/lib/models/Pocket";
import {
  analyzeTransactionImport,
  confirmTransactionImport,
  EXPENSE_TRANSACTION_CATEGORIES,
  INCOME_TRANSACTION_CATEGORIES,
  previewTransactionImport,
  TransactionCategory,
  TransactionImportAnalyzeResponse,
  TransactionImportConfirmResponse,
  TransactionImportPreviewResponse,
} from "@/lib/models/Transaction";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

interface ImportTesterContentProps {
  pockets: Pocket[];
}

export function ImportTesterContent({
  pockets,
}: Readonly<ImportTesterContentProps>) {
  const [file, setFile] = useState<File | null>(null);
  const [analyze, setAnalyze] =
    useState<TransactionImportAnalyzeResponse | null>(null);
  const [mapping, setMapping] = useState<Record<number, string>>({});
  const [pocketId, setPocketId] = useState(pockets[0]?.id.toString() ?? "");
  const [preview, setPreview] =
    useState<TransactionImportPreviewResponse | null>(null);
  const [confirm, setConfirm] =
    useState<TransactionImportConfirmResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const mappingItems = useMemo(
    () =>
      (analyze?.mappableFields ?? ["Ignore"]).map((field) => ({
        value: field,
        label: field,
      })),
    [analyze],
  );

  const pocketItems = pockets.map((pocket) => ({
    value: pocket.id.toString(),
    label: `${pocket.name} (#${pocket.id})`,
  }));

  async function handleAnalyze(event: FormEvent) {
    event.preventDefault();
    if (!file) {
      toast.error("Pick an Excel file first.");
      return;
    }

    setIsAnalyzing(true);
    setPreview(null);
    setConfirm(null);

    const result = await analyzeTransactionImport(file);

    setIsAnalyzing(false);

    if (result.status !== 200 || !result.data) {
      toast.error(importErrorMessage(result.status, "analyze"));
      setAnalyze(null);
      return;
    }

    const nextMapping: Record<number, string> = {};
    for (const column of result.data.columns) {
      nextMapping[column.index] = "Ignore";
    }

    setAnalyze(result.data);
    setMapping(nextMapping);
    toast.success("Analyze completed.");
  }

  async function handlePreview() {
    if (!analyze) {
      toast.error("Run analyze first.");
      return;
    }

    if (!pocketId) {
      toast.error("Select a pocket.");
      return;
    }

    setIsPreviewing(true);
    setConfirm(null);

    const result = await previewTransactionImport({
      sessionId: analyze.sessionId,
      pocketId: Number(pocketId),
      defaultCategory: TransactionCategory.Other,
      mapping: analyze.columns.map((column) => ({
        columnIndex: column.index,
        targetField: mapping[column.index] ?? "Ignore",
      })),
    });

    setIsPreviewing(false);

    if (result.status !== 200 || !result.data) {
      toast.error(importErrorMessage(result.status, "preview"));
      setPreview(null);
      return;
    }

    setPreview(result.data);
    toast.success(
      `Preview ready: ${result.data.transactions.length} drafts, ${result.data.errors.length} errors.`,
    );
  }

  async function handleConfirm() {
    if (!preview) {
      toast.error("Run preview first.");
      return;
    }

    if (preview.transactions.length === 0) {
      toast.error("No transactions to save.");
      return;
    }

    setIsConfirming(true);

    const result = await confirmTransactionImport({
      sessionId: preview.sessionId,
      pocketId: Number(pocketId),
      transactions: preview.transactions,
    });

    setIsConfirming(false);

    if (result.status !== 200 || !result.data) {
      toast.error(importErrorMessage(result.status, "confirm"));
      setConfirm(null);
      return;
    }

    setConfirm(result.data);
    toast.success(`Saved ${result.data.savedCount} transactions.`);
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      <Card>
        <CardHeader>
          <CardTitle>1. Analyze</CardTitle>
          <CardDescription>
            Upload an .xls / .xlsx / .csv file. Hidden tester page, not in the
            sidebar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4 md:flex-row md:items-end"
            onSubmit={handleAnalyze}
          >
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="import-file">Excel file</Label>
              <Input
                id="import-file"
                type="file"
                accept=".xls,.xlsx,.xlsm,.csv"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </div>
            <Button type="submit" disabled={isAnalyzing}>
              {isAnalyzing ? "Analyzing…" : "Analyze"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {analyze && (
        <Card>
          <CardHeader>
            <CardTitle>2. Mapping</CardTitle>
            <CardDescription>
              Session {analyze.sessionId}. Map each Excel column to a
              Transaction field (Amount and Date are required).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Column</TableHead>
                  <TableHead>Index</TableHead>
                  <TableHead>Maps to</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyze.columns.map((column) => (
                  <TableRow key={`${analyze.sessionId}-${column.index}`}>
                    <TableCell>{column.name}</TableCell>
                    <TableCell>{column.index}</TableCell>
                    <TableCell>
                      <Selection
                        items={mappingItems}
                        defaultValue={mapping[column.index] ?? "Ignore"}
                        onChange={(value) =>
                          setMapping((current) => ({
                            ...current,
                            [column.index]: value,
                          }))
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {analyze.sampleRows.length > 0 && (
              <div className="flex flex-col gap-2">
                <Label>Sample rows</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {analyze.columns.map((column) => (
                        <TableHead key={column.index}>{column.name}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyze.sampleRows.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {analyze.columns.map((column) => (
                          <TableCell key={column.index}>
                            {row[column.name] ?? ""}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <pre className="max-h-64 overflow-auto rounded-lg bg-muted p-3 text-xs">
              {JSON.stringify(analyze, null, 2)}
            </pre>

            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex min-w-64 flex-col gap-2">
                <Label>Pocket</Label>
                {pocketItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Create a pocket first.
                  </p>
                ) : (
                  <Selection
                    items={pocketItems}
                    defaultValue={pocketId}
                    onChange={setPocketId}
                  />
                )}
              </div>
              <Button
                type="button"
                onClick={handlePreview}
                disabled={isPreviewing || pocketItems.length === 0}
              >
                {isPreviewing ? "Previewing…" : "Preview"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {preview && (
        <Card>
          <CardHeader>
            <CardTitle>3. Preview</CardTitle>
            <CardDescription>
              {preview.transactions.length} draft transactions,{" "}
              {preview.errors.length} row errors.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {preview.errors.length > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-sm text-destructive">
                {preview.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Pocket</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.transactions.map((transaction, index) => (
                  <TableRow key={index}>
                    <TableCell>{transaction.date}</TableCell>
                    <TableCell>{transaction.description ?? ""}</TableCell>
                    <TableCell>{transaction.amount}</TableCell>
                    <TableCell>
                      <CategorySelect
                        value={transaction.category}
                        onChange={(category) =>
                          setPreview((current) => {
                            if (!current) {
                              return current;
                            }

                            return {
                              ...current,
                              transactions: current.transactions.map(
                                (item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, category }
                                    : item,
                              ),
                            };
                          })
                        }
                      />
                    </TableCell>
                    <TableCell>{transaction.pocketId}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Button
              type="button"
              className="self-start"
              onClick={handleConfirm}
              disabled={
                isConfirming ||
                preview.transactions.length === 0 ||
                confirm !== null
              }
            >
              {confirm
                ? "Saved"
                : isConfirming
                  ? "Saving…"
                  : "Confirm and save"}
            </Button>
          </CardContent>
        </Card>
      )}

      {confirm && (
        <Card>
          <CardHeader>
            <CardTitle>4. Confirm</CardTitle>
            <CardDescription>
              Saved {confirm.savedCount} transactions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Pocket</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {confirm.transactions.map((transaction, index) => (
                  <TableRow key={index}>
                    <TableCell>{transaction.date}</TableCell>
                    <TableCell>{transaction.description ?? ""}</TableCell>
                    <TableCell>{transaction.amount}</TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell>{transaction.pocketId}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

const CATEGORY_ITEMS = [
  ...EXPENSE_TRANSACTION_CATEGORIES,
  ...INCOME_TRANSACTION_CATEGORIES,
].map((category) => ({
  value: category,
  label: category.replace(/([A-Z])/g, " $1").trim(),
}));

function CategorySelect({
  value,
  onChange,
}: Readonly<{
  value: TransactionCategory;
  onChange: (category: TransactionCategory) => void;
}>) {
  const colors = CategoryColorMap[value] ?? DEFAULT_CATEGORY_COLORS;

  return (
    <Select
      value={value}
      onValueChange={(nextValue) => onChange(nextValue as TransactionCategory)}
    >
      <SelectTrigger
        className="w-full min-w-44 border dark:bg-transparent dark:hover:bg-transparent [&_svg]:text-current"
        style={{
          backgroundColor: colors.foreground,
          color: colors.background,
          borderColor: colors.background,
        }}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {CATEGORY_ITEMS.map((item) => {
            const itemColors =
              CategoryColorMap[item.value] ?? DEFAULT_CATEGORY_COLORS;

            return (
              <SelectItem
                key={item.value}
                value={item.value}
                style={{ color: itemColors.background }}
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: itemColors.background }}
                />
                {item.label}
              </SelectItem>
            );
          })}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function importErrorMessage(
  status: number,
  step: "analyze" | "preview" | "confirm",
) {
  if (status === 0) {
    return "Server is unreachable.";
  }

  if (status === 404) {
    return "Import session expired. Analyze the file again.";
  }

  if (status === 400) {
    if (step === "analyze") {
      return "The file is invalid or unsupported.";
    }
    if (step === "preview") {
      return "The column mapping is invalid.";
    }
    return "Nothing to save.";
  }

  return "Something went wrong. Please try again.";
}
