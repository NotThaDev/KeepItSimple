"use client";

import { Pocket } from "@/lib/models/Pocket";
import {
  analyzeTransactionImport,
  confirmTransactionImport,
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
import type {
  ImportStep,
  TransactionImportContext as TransactionImportContextValue,
} from "./types";

const TransactionImportContext =
  createContext<TransactionImportContextValue | null>(null);

function mappingTargets(mapping: Record<number, string>) {
  return Object.values(mapping).filter((field) => field !== "Ignore");
}

function isMappingReady(mapping: Record<number, string>) {
  const targets = mappingTargets(mapping);
  const uniqueTargets = new Set(targets);
  return (
    targets.includes("Amount") &&
    targets.includes("Date") &&
    uniqueTargets.size === targets.length
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
  const [step, setStep] = useState<ImportStep>(1);
  const [file, setFile] = useState<File | null>(null);
  const [analyze, setAnalyze] =
    useState<TransactionImportContextValue["analyze"]>(null);
  const [mapping, setMapping] = useState<Record<number, string>>({});
  const [pocketId, setPocketId] = useState(pockets[0]?.id.toString() ?? "");
  const [preview, setPreview] =
    useState<TransactionImportPreviewResponse | null>(null);
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

  const pocketItems = useMemo(
    () =>
      pockets.map((pocket) => ({
        value: pocket.id.toString(),
        label: pocket.name,
      })),
    [pockets],
  );

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
    setStep(1);
    setFile(null);
    setAnalyze(null);
    setMapping({});
    setPocketId(pockets[0]?.id.toString() ?? "");
    setPreview(null);
    setIsAnalyzing(false);
    setIsPreviewing(false);
    setIsConfirming(false);
  }, [pockets]);

  const handleOpenChange = useCallback(
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
    (columnIndex: number, targetField: string) => {
      setMapping((current) => ({
        ...current,
        [columnIndex]: targetField,
      }));
    },
    [],
  );

  const handleAnalyze = useCallback(async () => {
    if (!file) {
      toast.error("Pick a file first.");
      return;
    }

    if (!pocketId) {
      toast.error("Select a pocket.");
      return;
    }

    setIsAnalyzing(true);
    setPreview(null);

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
    setStep(2);
  }, [file, pocketId]);

  const handlePreview = useCallback(async () => {
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

    setIsPreviewing(true);

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
    setStep(3);
  }, [analyze, mapping, pocketId]);

  const handleConfirm = useCallback(async () => {
    if (!preview || preview.transactions.length === 0) {
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
      return;
    }

    toast.success(`Saved ${result.data.savedCount} transactions.`);
    handleOpenChange(false);
    onImported();
  }, [handleOpenChange, onImported, pocketId, preview]);

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
      pocketId,
      preview,
      isAnalyzing,
      isPreviewing,
      isConfirming,
      pockets,
      mappingItems,
      pocketItems,
      selectedPocket,
      previewTotal,
      canContinueToPreview,
      handleOpenChange,
      setStep,
      handleFileChange,
      setPocketId,
      setMappingField,
      handleAnalyze,
      handlePreview,
      handleConfirm,
      updateDraftCategory,
      removeDraft,
    }),
    [
      analyze,
      canContinueToPreview,
      file,
      handleAnalyze,
      handleConfirm,
      handleFileChange,
      handleOpenChange,
      handlePreview,
      isAnalyzing,
      isConfirming,
      isPreviewing,
      mapping,
      mappingItems,
      open,
      pocketId,
      pocketItems,
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
