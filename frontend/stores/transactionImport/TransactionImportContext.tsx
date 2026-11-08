"use client";

import {
  createImportMapping,
  deleteImportMapping,
  getImportMappings,
  ImportMapping,
  ImportMappingInput,
  updateImportMapping,
} from "@/lib/models/ImportMapping";
import { Pocket } from "@/lib/models/Pocket";
import {
  analyzeTransactionImport,
  confirmTransactionImport,
  MappableField,
  previewTransactionImport,
  TransactionCategory,
  TransactionImportColumn,
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
import { ImportStep, MappingNote } from "./types";
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

function normalizeHeader(header: string) {
  return header.trim().toLowerCase();
}

// A header that appears more than once in the file cannot be matched safely, so it stays Ignore.
function mappingFromSaved(
  columns: TransactionImportColumn[],
  saved: ImportMapping,
) {
  const fileCounts = new Map<string, number>();
  for (const column of columns) {
    const key = normalizeHeader(column.name);
    fileCounts.set(key, (fileCounts.get(key) ?? 0) + 1);
  }

  const savedByHeader = new Map<string, MappableField>();
  for (const column of saved.columns) {
    savedByHeader.set(normalizeHeader(column.header), column.targetField);
  }

  const mapping: Record<number, MappableField> = {};
  for (const column of columns) {
    const key = normalizeHeader(column.name);
    const targetField =
      fileCounts.get(key) === 1 ? savedByHeader.get(key) : undefined;
    mapping[column.index] = targetField ?? MappableField.Ignore;
  }

  const missingHeaders = saved.columns
    .filter(
      (column) =>
        column.targetField !== MappableField.Ignore &&
        fileCounts.get(normalizeHeader(column.header)) !== 1,
    )
    .map((column) => column.header);

  return { mapping, missingHeaders };
}

// The import-mappings API explains 400/409 as { message }.
function mappingErrorMessage(errorData: unknown, fallback: string) {
  const message = (errorData as { message?: unknown } | undefined)?.message;
  return typeof message === "string" ? message : fallback;
}

function toMappingInput(
  name: string,
  columns: TransactionImportColumn[],
  mapping: Record<number, MappableField>,
): ImportMappingInput {
  // Blank or repeated headers can't be matched by name, so they aren't saved.
  const counts = new Map<string, number>();
  for (const column of columns) {
    const key = normalizeHeader(column.name);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return {
    name,
    columns: columns
      .filter((column) => {
        const key = normalizeHeader(column.name);
        return key !== "" && counts.get(key) === 1;
      })
      .map((column) => ({
        header: column.name,
        targetField: mapping[column.index] ?? MappableField.Ignore,
      })),
  };
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
  const [savedMappings, setSavedMappings] = useState<ImportMapping[]>([]);
  const [selectedMappingId, setSelectedMappingId] = useState<number | null>(
    null,
  );
  const [mappingNote, setMappingNote] = useState<MappingNote | null>(null);
  const [isSavingMapping, setIsSavingMapping] = useState(false);

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
  const canSaveMapping = isMappingReady(mapping);

  const selectedMappingChanged = useMemo(() => {
    const saved = savedMappings.find((item) => item.id === selectedMappingId);
    if (!analyze || !saved) {
      return false;
    }

    const expected = mappingFromSaved(analyze.columns, saved).mapping;
    return analyze.columns.some(
      (column) =>
        (mapping[column.index] ?? MappableField.Ignore) !==
        (expected[column.index] ?? MappableField.Ignore),
    );
  }, [analyze, mapping, savedMappings, selectedMappingId]);

  const reset = useCallback(() => {
    setStep(ImportStep.Analyze);
    setFile(null);
    setAnalyze(null);
    setMapping({});
    setPocketId(pockets[0]?.id.toString() ?? "");
    setPreview(null);
    setIsLoading(false);
    setSelectedMappingId(null);
    setMappingNote(null);
  }, [pockets]);

  const loadSavedMappings = useCallback(async (): Promise<ImportMapping[]> => {
    const result = await getImportMappings();
    if (result.status !== 200 || !result.data) {
      return [];
    }

    setSavedMappings(result.data);
    return result.data;
  }, []);

  const openDialog = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (nextOpen) {
        void loadSavedMappings();
      } else {
        reset();
      }
    },
    [loadSavedMappings, reset],
  );

  const handleFileChange = useCallback((nextFile: File | null) => {
    setFile(nextFile);
    setAnalyze(null);
    setMapping({});
    setPreview(null);
    setSelectedMappingId(null);
    setMappingNote(null);
  }, []);

  const setMappingField = useCallback(
    (columnIndex: number, targetField: MappableField) => {
      setMapping((current) => ({
        ...current,
        [columnIndex]: targetField,
      }));
      setMappingNote(null);
    },
    [],
  );

  const applySavedMapping = useCallback(
    (id: number | null) => {
      if (id === null) {
        setSelectedMappingId(null);
        setMappingNote(null);
        return;
      }

      const saved = savedMappings.find((item) => item.id === id);
      if (!analyze || !saved) {
        return;
      }

      const applied = mappingFromSaved(analyze.columns, saved);
      setMapping(applied.mapping);
      setSelectedMappingId(saved.id);
      setMappingNote({
        appliedName: saved.name,
        missingHeaders: applied.missingHeaders,
        auto: false,
      });
    },
    [analyze, savedMappings],
  );

  const saveMappingAs = useCallback(
    async (name: string) => {
      if (!analyze || !isMappingReady(mapping)) {
        return false;
      }

      setIsSavingMapping(true);
      const result = await createImportMapping(
        toMappingInput(name.trim(), analyze.columns, mapping),
      );
      setIsSavingMapping(false);

      if (result.status !== 201 || !result.data) {
        toast.error(mappingErrorMessage(result.errorData, "Could not save the mapping."));
        return false;
      }

      toast.success("Mapping saved");
      await loadSavedMappings();
      setSelectedMappingId(result.data.id);
      setMappingNote(null);
      return true;
    },
    [analyze, loadSavedMappings, mapping],
  );

  const updateSelectedMapping = useCallback(async () => {
    const selected = savedMappings.find((item) => item.id === selectedMappingId);
    if (!analyze || !selected || !isMappingReady(mapping)) {
      return;
    }

    setIsSavingMapping(true);
    const result = await updateImportMapping(
      selected.id,
      toMappingInput(selected.name, analyze.columns, mapping),
    );
    setIsSavingMapping(false);

    if (result.status !== 200 || !result.data) {
      toast.error(mappingErrorMessage(result.errorData, "Could not save the mapping."));
      return;
    }

    toast.success("Mapping updated");
    await loadSavedMappings();
  }, [analyze, loadSavedMappings, mapping, savedMappings, selectedMappingId]);

  const deleteSelectedMapping = useCallback(async () => {
    if (selectedMappingId === null) {
      return false;
    }

    setIsSavingMapping(true);
    const result = await deleteImportMapping(selectedMappingId);
    setIsSavingMapping(false);

    if (result.status !== 204) {
      toast.error(mappingErrorMessage(result.errorData, "Could not delete the mapping."));
      return false;
    }

    toast.success("Mapping deleted");
    setSelectedMappingId(null);
    setMappingNote(null);
    await loadSavedMappings();
    return true;
  }, [loadSavedMappings, selectedMappingId]);

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

    let nextSelectedId: number | null = null;
    let nextNote: MappingNote | null = null;
    const suggestedId = result.data.suggestedMappingId;
    if (suggestedId != null) {
      let candidates = savedMappings;
      if (!candidates.some((item) => item.id === suggestedId)) {
        candidates = await loadSavedMappings();
      }

      const suggested = candidates.find((item) => item.id === suggestedId);
      if (suggested) {
        const applied = mappingFromSaved(result.data.columns, suggested);
        Object.assign(nextMapping, applied.mapping);
        nextSelectedId = suggested.id;
        nextNote = {
          appliedName: suggested.name,
          missingHeaders: [],
          auto: true,
        };
      }
    }

    setAnalyze(result.data);
    setMapping(nextMapping);
    setSelectedMappingId(nextSelectedId);
    setMappingNote(nextNote);
    setStep(ImportStep.Mapping);
  }, [file, loadSavedMappings, pocketId, savedMappings]);

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
      savedMappings,
      selectedMappingId,
      mappingNote,
      canSaveMapping,
      selectedMappingChanged,
      isSavingMapping,
      applySavedMapping,
      saveMappingAs,
      updateSelectedMapping,
      deleteSelectedMapping,
    }),
    [
      analyze,
      analyzeFile,
      applySavedMapping,
      canContinueToPreview,
      canSaveMapping,
      confirmTransactions,
      deleteSelectedMapping,
      file,
      handleFileChange,
      isLoading,
      isSavingMapping,
      mapping,
      mappingNote,
      open,
      openDialog,
      pockets,
      preview,
      previewTotal,
      previewTransactions,
      removeDraft,
      saveMappingAs,
      savedMappings,
      selectedMappingChanged,
      selectedMappingId,
      selectedPocket,
      setMappingField,
      step,
      updateDraftCategory,
      updateSelectedMapping,
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
