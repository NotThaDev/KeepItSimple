import type { Pocket } from "@/lib/models/Pocket";
import type {
  TransactionCategory,
  TransactionImportAnalyzeResponse,
  TransactionImportPreviewResponse,
} from "@/lib/models/Transaction";

export type ImportStep = 1 | 2 | 3 | 4;

export interface SelectionItem {
  value: string;
  label: string;
}

export interface TransactionImportContextState {
  open: boolean;
  step: ImportStep;
  file: File | null;
  analyze: TransactionImportAnalyzeResponse | null;
  mapping: Record<number, string>;
  pocketId: string;
  preview: TransactionImportPreviewResponse | null;
  isAnalyzing: boolean;
  isPreviewing: boolean;
  isConfirming: boolean;
  pockets: Pocket[];
  mappingItems: SelectionItem[];
  pocketItems: SelectionItem[];
  selectedPocket: Pocket | undefined;
  previewTotal: number;
  canContinueToPreview: boolean;
}

export interface TransactionImportContextAction {
  handleOpenChange: (open: boolean) => void;
  setStep: (step: ImportStep) => void;
  handleFileChange: (file: File | null) => void;
  setPocketId: (pocketId: string) => void;
  setMappingField: (columnIndex: number, targetField: string) => void;
  handleAnalyze: () => Promise<void>;
  handlePreview: () => Promise<void>;
  handleConfirm: () => Promise<void>;
  updateDraftCategory: (index: number, category: TransactionCategory) => void;
  removeDraft: (index: number) => void;
}

export type TransactionImportContext = TransactionImportContextState &
  TransactionImportContextAction;
