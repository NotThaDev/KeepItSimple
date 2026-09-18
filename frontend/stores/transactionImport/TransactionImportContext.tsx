"use client";

import { Pocket } from "@/lib/models/Pocket";
import {
  analyzeTransactionImport,
  confirmTransactionImport,
  MappableField,
  previewTransactionImport,
  TransactionCategory,
  TransactionImportPreviewResponse,
} from "@/lib/models/Transaction";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { importErrorMessage } from "./utils";
import { ImportStep } from "./types";
import type { TransactionImportContext as TransactionImportContextValue } from "./types";

const TransactionImportContext =
  createContext<TransactionImportContextValue | null>(null);

function isMappingReady(mapping: Record<number, MappableField>) {
  const assignedFields = Object.values(mapping).filter(
    (field) => field !== MappableField.Ignore,
  );
  const uniqueAssignedFields = new Set(assignedFields);
  return (
    assignedFields.includes(MappableField.Amount) &&
    assignedFields.includes(MappableField.Date) &&
    uniqueAssignedFields.size === assignedFields.length
  );
}

interface TransactionImportProviderProps {
  pockets: Pocket[];
  onImported: () => void;
  children: ReactNode;
}

export function TransactionImportProvider({
  pockets,
  onImported,
  children,
}: Readonly<TransactionImportProviderProps>) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<ImportStep>(ImportStep.Analyze);
  const [file, setFile] = useState<File | null>(null);
  const [analyze, setAnalyze] =
    useState<TransactionImportContextValue["analyze"]>(null);
  const [mapping, setMapping] = useState<Record<number, MappableField>>({});
  const [pocketId, setPocketId] = useState(pockets[0]?.id.toString() ?? "");
  const [preview, setPreview] =
    useState<TransactionImportPreviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const selectedPocket = useMemo(
    () => pockets.find((pocket) => pocket.id.toString() === pocketId),
    [pocketId, pockets],
  );

  const previewTotal = useMemo(
    () =>
      preview?.transactions.reduce(
        (sum, transaction) => sum + transaction.amount,
        0,
      ) ?? 0,
    [preview],
  );

  const canContinueToPreview =
    Boolean(analyze) && Boolean(pocketId) && isMappingReady(mapping);

  const reset = useCallback(() => {
    setStep(ImportStep.Analyze);
    setFile(null);
    setAnalyze(null);
    setMapping({});
    setPocketId(pockets[0]?.id.toString() ?? "");
    setPreview(null);
    setIsLoading(false);
  }, [pockets]);

  const openDialog = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (!nextOpen) {
        reset();
      }
    },
    [reset],
  );

  const handleFileChange = useCallback((nextFile: File | null) => {
    setFile(nextFile);
    setAnalyze(null);
    setMapping({});
    setPreview(null);
  }, []);

  const setMappingField = useCallback(
    (columnIndex: number, targetField: MappableField) => {
      setMapping((current) => ({
        ...current,
        [columnIndex]: targetField,
      }));
    },
    [],
  );

  const analyzeFile = useCallback(async () => {
    if (!file) {
      toast.error("Pick a file first.");
      return;
    }

    if (!pocketId) {
      toast.error("Select a pocket.");
      return;
    }

    setIsLoading(true);
    setPreview(null);

    const result = await analyzeTransactionImport(file);
    setIsLoading(false);

    if (result.status !== 200 || !result.data) {
      toast.error(importErrorMessage(result.status, ImportStep.Analyze));
      setAnalyze(null);
      return;
    }

    const nextMapping: Record<number, MappableField> = {};
    for (const column of result.data.columns) {
      nextMapping[column.index] = MappableField.Ignore;
    }

    setAnalyze(result.data);
    setMapping(nextMapping);
    setStep(ImportStep.Mapping);
  }, [file, pocketId]);

  const previewTransactions = useCallback(async () => {
    if (!analyze) {
      toast.error("Analyze a file first.");
      return;
    }

    if (!pocketId) {
      toast.error("Select a pocket.");
      return;
    }

    if (!isMappingReady(mapping)) {
      toast.error("Map Amount and Date, without duplicate fields.");
      return;
    }

    setIsLoading(true);

    const result = await previewTransactionImport({
      sessionId: analyze.sessionId,
      pocketId: Number(pocketId),
      defaultCategory: TransactionCategory.Other,
      mapping: analyze.columns.map((column) => ({
        columnIndex: column.index,
        targetField: mapping[column.index] ?? MappableField.Ignore,
      })),
    });

    setIsLoading(false);

    if (result.status !== 200 || !result.data) {
      toast.error(importErrorMessage(result.status, ImportStep.Preview));
      setPreview(null);
      return;
    }

    setPreview(result.data);
    setStep(ImportStep.Preview);
  }, [analyze, mapping, pocketId]);

  const confirmTransactions = useCallback(async () => {
    if (!preview || preview.transactions.length === 0) {
      toast.error("No transactions to save.");
      return;
    }

    setIsLoading(true);

    const result = await confirmTransactionImport({
      sessionId: preview.sessionId,
      pocketId: Number(pocketId),
      transactions: preview.transactions,
    });

    setIsLoading(false);

    if (result.status !== 200 || !result.data) {
      toast.error(importErrorMessage(result.status, ImportStep.Confirm));
      return;
    }

    toast.success(`Saved ${result.data.savedCount} transactions.`);
    openDialog(false);
    onImported();
  }, [openDialog, onImported, pocketId, preview]);

  const updateDraftCategory = useCallback(
    (index: number, category: TransactionCategory) => {
      setPreview((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          transactions: current.transactions.map((item, itemIndex) =>
            itemIndex === index ? { ...item, category } : item,
          ),
        };
      });
    },
    [],
  );

  const removeDraft = useCallback((index: number) => {
    setPreview((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        transactions: current.transactions.filter(
          (_, itemIndex) => itemIndex !== index,
        ),
      };
    });
  }, []);

  const value = useMemo<TransactionImportContextValue>(
    () => ({
      open,
      step,
      file,
      analyze,
      mapping,
      selectedPocket,
      preview,
      isLoading,
      pockets,
      previewTotal,
      canContinueToPreview,
      openDialog,
      setStep,
      handleFileChange,
      setPocketId,
      setMappingField,
      analyzeFile,
      previewTransactions,
      confirmTransactions,
      updateDraftCategory,
      removeDraft,
    }),
    [
      analyze,
      canContinueToPreview,
      file,
      analyzeFile,
      confirmTransactions,
      handleFileChange,
      openDialog,
      previewTransactions,
      isLoading,
      mapping,
      open,
      pockets,
      preview,
      previewTotal,
      removeDraft,
      selectedPocket,
      setMappingField,
      step,
      updateDraftCategory,
    ],
  );

  return (
    <TransactionImportContext.Provider value={value}>
      {children}
    </TransactionImportContext.Provider>
  );
}

export function useTransactionImportContext() {
  const context = useContext(TransactionImportContext);
  if (!context) {
    throw new Error(
      "useTransactionImportContext must be used within TransactionImportProvider",
    );
  }

  return context;
}
