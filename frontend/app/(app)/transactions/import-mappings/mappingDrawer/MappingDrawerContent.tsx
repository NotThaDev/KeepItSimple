"use client";

import { Button } from "@/components/ui/button";
import { Selection } from "@/components/common/selector/Selection";
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
import {
  createImportMapping,
  ImportMapping,
  ImportMappingInput,
  mappingErrorMessage,
  updateImportMapping,
} from "@/lib/models/ImportMapping";
import { isMappableField } from "@/lib/models/Transaction";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  MAX_NAME_LENGTH,
  MappingRow,
  MappingValidation,
  rowsFrom,
  TARGET_FIELDS,
  validateMapping,
} from "./utils";

const FIELD_ITEMS = TARGET_FIELDS.map((field) => ({
  value: field,
  label: field,
}));

interface MappingDrawerContentProps {
  mapping?: ImportMapping;
  onSave?: () => void;
}

export function MappingDrawerContent({
  mapping,
  onSave,
}: Readonly<MappingDrawerContentProps>) {
  const [name, setName] = useState(mapping?.name ?? "");
  const [rows, setRows] = useState<MappingRow[]>(() => rowsFrom(mapping));
  const [validation, setValidation] = useState<MappingValidation | null>(null);
  const [saving, setSaving] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const headerInputs = useRef(new Map<string, HTMLInputElement>());
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const focusKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (focusKeyRef.current) {
      headerInputs.current.get(focusKeyRef.current)?.focus();
      focusKeyRef.current = null;
    }
  }, [rows]);

  const changeName = (next: string) => {
    setName(next);
    setValidation((current) => (current ? validateMapping(next, rows) : null));
  };

  const changeRows = (next: MappingRow[]) => {
    setRows(next);
    setValidation((current) => (current ? validateMapping(name, next) : null));
  };

  const updateRow = (key: string, patch: Partial<MappingRow>) => {
    changeRows(
      rows.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  };

  const unusedField = TARGET_FIELDS.find(
    (field) => !rows.some((row) => row.targetField === field),
  );

  const addRow = () => {
    if (!unusedField) {
      return;
    }
    const key = crypto.randomUUID();
    focusKeyRef.current = key;
    changeRows([...rows, { key, header: "", targetField: unusedField }]);
  };

  const removeRow = (key: string) => {
    headerInputs.current.delete(key);
    changeRows(rows.filter((row) => row.key !== key));
    addButtonRef.current?.focus();
  };

  const handleSave = async () => {
    const nextValidation = validateMapping(name, rows);
    setValidation(nextValidation);
    if (nextValidation) {
      if (nextValidation.nameInvalid) {
        nameInputRef.current?.focus();
      } else {
        const firstInvalid = rows.find((row) =>
          nextValidation.invalidRowKeys.includes(row.key),
        );
        if (firstInvalid) {
          headerInputs.current.get(firstInvalid.key)?.focus();
        }
      }
      return;
    }

    const input: ImportMappingInput = {
      name: name.trim(),
      columns: rows.map((row) => ({
        header: row.header.trim(),
        targetField: row.targetField,
      })),
    };

    setSaving(true);
    const response = mapping
      ? await updateImportMapping(mapping.id, input)
      : await createImportMapping(input);
    setSaving(false);

    if (!response.data) {
      toast.error(
        mappingErrorMessage(response.errorData, "Could not save the mapping."),
      );
      return;
    }

    toast.success(mapping ? "Mapping updated" : "Mapping created");
    onSave?.();
  };

  return (
    <DrawerContent className="h-full overflow-hidden data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-2xl">
      <DrawerHeader>
        <DrawerTitle>{mapping ? "Edit mapping" : "Create mapping"}</DrawerTitle>
        <DrawerDescription>
          Add the file columns to import. Headers are matched
          case-insensitively. Amount and Date are required.
        </DrawerDescription>
      </DrawerHeader>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <FieldGroup className="space-y-4 p-5">
          <Field>
            <FieldLabel htmlFor="mapping-name">Name</FieldLabel>
            <Input
              id="mapping-name"
              ref={nameInputRef}
              placeholder="e.g. Fineco export"
              maxLength={MAX_NAME_LENGTH}
              value={name}
              onChange={(event) => changeName(event.target.value)}
              aria-invalid={validation?.nameInvalid}
              aria-describedby={
                validation?.nameInvalid ? "mapping-errors" : undefined
              }
            />
          </Field>

          <div className="flex flex-col gap-2">
            {rows.map((row, index) => {
              const invalid = validation?.invalidRowKeys.includes(row.key);
              return (
                <div
                  key={row.key}
                  className="flex flex-col gap-2 sm:flex-row sm:items-center"
                >
                  <Input
                    ref={(element) => {
                      if (element) {
                        headerInputs.current.set(row.key, element);
                      } else {
                        headerInputs.current.delete(row.key);
                      }
                    }}
                    aria-label={`Column header ${index + 1}`}
                    placeholder="Header in the file"
                    value={row.header}
                    onChange={(event) =>
                      updateRow(row.key, { header: event.target.value })
                    }
                    aria-invalid={invalid}
                    aria-describedby={invalid ? "mapping-errors" : undefined}
                    className="sm:flex-1"
                  />
                  <Selection
                    items={FIELD_ITEMS}
                    value={row.targetField}
                    aria-label={`Field for column ${index + 1}`}
                    className="sm:w-44"
                    onChange={(value) => {
                      if (isMappableField(value)) {
                        updateRow(row.key, { targetField: value });
                      }
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove column ${index + 1}`}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={rows.length === 1}
                    onClick={() => removeRow(row.key)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              );
            })}
          </div>

          <div>
            <Button
              variant="outline"
              ref={addButtonRef}
              disabled={!unusedField}
              onClick={addRow}
            >
              <Plus />
              Add column
            </Button>
          </div>

          {validation ? (
            <ul
              id="mapping-errors"
              role="alert"
              className="text-sm text-destructive"
            >
              {validation.messages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          ) : null}
        </FieldGroup>
      </div>
      <DrawerFooter className="shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t">
        <DrawerClose asChild>
          <Button variant="outline" disabled={saving}>
            Cancel
          </Button>
        </DrawerClose>
        <Button onClick={handleSave} disabled={saving}>
          {mapping ? "Update" : "Save"}
        </Button>
      </DrawerFooter>
    </DrawerContent>
  );
}
