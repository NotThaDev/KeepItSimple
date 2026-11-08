"use client";

import { ConfirmationDialogContent } from "@/components/common/ConfirmationDialogContent";
import { Selection } from "@/components/common/selector/Selection";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTransactionImportContext } from "@/stores/transactionImport";
import { Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";

const NONE_VALUE = "none";

export function SavedMappingBar() {
  const {
    savedMappings,
    selectedMappingId,
    mappingNote,
    canSaveMapping,
    selectedMappingChanged,
    isLoading,
    isSavingMapping,
    applySavedMapping,
    saveMappingAs,
    updateSelectedMapping,
    deleteSelectedMapping,
  } = useTransactionImportContext();
  const [saveOpen, setSaveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [name, setName] = useState("");

  const isBusy = isLoading || isSavingMapping;
  const selectedMapping = savedMappings.find(
    (item) => item.id === selectedMappingId,
  );
  const pickerItems = [
    { value: NONE_VALUE, label: "None" },
    ...savedMappings.map((item) => ({
      value: String(item.id),
      label: item.name,
    })),
  ];

  const handlePickerChange = (value: string) => {
    if (isBusy) {
      return;
    }
    applySavedMapping(value === NONE_VALUE ? null : Number(value));
  };

  const handleSaveSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }

    const saved = await saveMappingAs(trimmed);
    if (saved) {
      setSaveOpen(false);
      setName("");
    }
  };

  const handleSaveOpenChange = (nextOpen: boolean) => {
    setSaveOpen(nextOpen);
    if (!nextOpen) {
      setName("");
    }
  };

  const handleDeleteConfirm = async () => {
    if (await deleteSelectedMapping()) {
      setDeleteOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor="saved-mapping-picker">Saved mapping</Label>
      <div className="flex flex-wrap items-center gap-2">
        {savedMappings.length > 0 ? (
          <Selection
            items={pickerItems}
            value={
              selectedMappingId === null ? NONE_VALUE : String(selectedMappingId)
            }
            onChange={handlePickerChange}
            id="saved-mapping-picker"
            className="sm:w-56"
          />
        ) : null}

        <Popover open={saveOpen} onOpenChange={handleSaveOpenChange}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isBusy || !canSaveMapping}
            >
              Save as new
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 max-w-[calc(100vw-2rem)]">
            <form onSubmit={handleSaveSubmit} className="flex flex-col gap-2">
              <Label htmlFor="saved-mapping-name">Name</Label>
              <Input
                id="saved-mapping-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={100}
                placeholder="e.g. Fineco export"
                autoFocus
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={isBusy || !canSaveMapping || name.trim() === ""}
                >
                  {isSavingMapping ? "Saving…" : "Save"}
                </Button>
              </div>
            </form>
          </PopoverContent>
        </Popover>

        {selectedMapping ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={updateSelectedMapping}
              disabled={isBusy || !canSaveMapping || !selectedMappingChanged}
            >
              Update
            </Button>

            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete saved mapping"
                  disabled={isBusy}
                >
                  <Trash2 />
                </Button>
              </DialogTrigger>
              <ConfirmationDialogContent
                title="Delete mapping?"
                description={`“${selectedMapping.name}” will be removed. Columns already mapped stay as they are.`}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeleteOpen(false)}
                confirmButtonVariant="destructive"
              />
            </Dialog>
          </>
        ) : null}
      </div>

      <div
        aria-live="polite"
        className="flex flex-col gap-1 text-xs text-muted-foreground"
      >
        {mappingNote?.auto && mappingNote.appliedName ? (
          <p>
            Applied “
            <span className="font-medium text-foreground">
              {mappingNote.appliedName}
            </span>
            ” — matches this file&apos;s columns.
          </p>
        ) : null}
        {mappingNote && !mappingNote.auto && mappingNote.missingHeaders.length > 0 ? (
          <p>Not matched in this file: {mappingNote.missingHeaders.join(", ")}</p>
        ) : null}
      </div>
    </div>
  );
}
