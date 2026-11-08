import type { ImportMapping } from "@/lib/models/ImportMapping";
import type { Pocket } from "@/lib/models/Pocket";
import type {
  MappableField,
  TransactionCategory,
  TransactionImportAnalyzeResponse,
  TransactionImportPreviewResponse,
} from "@/lib/models/Transaction";

export enum ImportStep {
  Analyze = "analyze",
  Mapping = "mapping",
  Preview = "preview",
  Confirm = "confirm",
}

export interface MappingNote {
  appliedName?: string;
  missingHeaders: string[];
  auto: boolean;
}

export interface TransactionImportContextState {
  open: boolean;
  step: ImportStep;
  file: File | null;
  analyze: TransactionImportAnalyzeResponse | null;
  mapping: Record<number, MappableField>;
  selectedPocket: Pocket | undefined;
  preview: TransactionImportPreviewResponse | null;
  isLoading: boolean;
  pockets: Pocket[];
  previewTotal: number;
  canContinueToPreview: boolean;
  savedMappings: ImportMapping[];
  selectedMappingId: number | null;
  mappingNote: MappingNote | null;
  canSaveMapping: boolean;
  selectedMappingChanged: boolean;
  isSavingMapping: boolean;
}

export interface TransactionImportContextAction {
  openDialog: (open: boolean) => void;
  setStep: (step: ImportStep) => void;
  handleFileChange: (file: File | null) => void;
  setPocketId: (pocketId: string) => void;
  setMappingField: (columnIndex: number, targetField: MappableField) => void;
  analyzeFile: () => Promise<void>;
  previewTransactions: () => Promise<void>;
  confirmTransactions: () => Promise<void>;
  updateDraftCategory: (index: number, category: TransactionCategory) => void;
  removeDraft: (index: number) => void;
  applySavedMapping: (id: number | null) => void;
  saveMappingAs: (name: string) => Promise<boolean>;
  updateSelectedMapping: () => Promise<void>;
  deleteSelectedMapping: () => Promise<boolean>;
}

export type TransactionImportContext = TransactionImportContextState &
  TransactionImportContextAction;
