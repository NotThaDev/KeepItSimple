"use client";

import { CategoryBadge } from "@/components/common/category/CategoryBadge";
import { ColorPicker } from "@/components/common/category/ColorPicker";
import { IconPicker } from "@/components/common/category/IconPicker";
import { Button } from "@/components/ui/button";
import {
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Category,
  CategoryInput,
  CategoryKind,
  createCategory,
  updateCategory,
} from "@/lib/models/Category";
import { useCategories } from "@/stores/categories";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const MAX_SWATCHES = 16;

interface CategoryDrawerContentProps {
  category?: Category;
  onSave?: () => void;
}

export function CategoryDrawerContent({
  category,
  onSave,
}: Readonly<CategoryDrawerContentProps>) {
  const { categories } = useCategories();
  const swatches = useMemo(
    () =>
      [
        ...new Set(
          categories.filter((c) => c.key !== null).map((c) => c.color),
        ),
      ].slice(0, MAX_SWATCHES),
    [categories],
  );
  const [draft, setDraft] = useState<CategoryInput>(() => ({
    name: category?.name ?? "",
    kind: category?.kind ?? "Expense",
    icon: category?.icon ?? "Tag",
    color: category?.color ?? swatches[0] ?? "#9E9E9E",
  }));
  const [nameError, setNameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const name = draft.name.trim();
    if (name.length < 1 || name.length > 40) {
      setNameError("Name must be 1 to 40 characters.");
      return;
    }

    setSaving(true);
    const body = { ...draft, name };
    const response = category
      ? await updateCategory(category.id, body)
      : await createCategory(body);
    setSaving(false);

    if (response.error) {
      if (response.status === 400 && typeof response.errorData === "string") {
        setNameError(response.errorData);
      } else {
        toast.error(
          `Failed to ${category ? "update" : "create"} category: ${response.error}`,
        );
      }
      return;
    }

    toast.success(`Category ${category ? "updated" : "created"} successfully!`);
    onSave?.();
  };

  return (
    <DrawerContent className="h-full overflow-hidden data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-lg">
      <DrawerHeader>
        <DrawerTitle>{category ? "Edit category" : "New category"}</DrawerTitle>
        <DrawerDescription className="sr-only">
          Choose a name, kind, icon and color.
        </DrawerDescription>
      </DrawerHeader>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <FieldGroup className="space-y-4 p-5">
          <Field>
            <FieldLabel htmlFor="category-name">Name</FieldLabel>
            <Input
              id="category-name"
              placeholder="Groceries"
              maxLength={40}
              autoFocus
              required
              value={draft.name}
              onChange={(event) => {
                setDraft({ ...draft, name: event.target.value });
                setNameError(null);
              }}
              aria-invalid={nameError !== null}
            />
            {nameError ? <FieldError>{nameError}</FieldError> : null}
          </Field>

          <Field>
            <FieldLabel>Type</FieldLabel>
            <ToggleGroup
              type="single"
              variant="outline"
              value={draft.kind}
              onValueChange={(kind) => {
                if (kind === "Expense" || kind === "Income") {
                  setDraft({ ...draft, kind: kind as CategoryKind });
                }
              }}
              aria-label="Type"
            >
              <ToggleGroupItem value="Expense">Expense</ToggleGroupItem>
              <ToggleGroupItem value="Income">Income</ToggleGroupItem>
            </ToggleGroup>
          </Field>

          <Field>
            <FieldLabel>Icon</FieldLabel>
            <IconPicker
              value={draft.icon}
              onChange={(icon) => setDraft({ ...draft, icon })}
            />
          </Field>
          <Field>
            <FieldLabel>Color</FieldLabel>
            <ColorPicker
              value={draft.color}
              colors={
                swatches.includes(draft.color)
                  ? swatches
                  : [draft.color, ...swatches]
              }
              onChange={(color) => setDraft({ ...draft, color })}
            />
          </Field>

          <Field>
            <FieldLabel className="text-muted-foreground">Preview</FieldLabel>
            <div>
              <CategoryBadge
                showIcon
                preview={{ ...draft, name: draft.name.trim() || "Category" }}
              />
            </div>
          </Field>
        </FieldGroup>
      </div>
      <DrawerFooter className="shrink-0 flex flex-col-reverse gap-2 border-t sm:flex-row sm:justify-end">
        <DrawerClose asChild>
          <Button variant="outline">Cancel</Button>
        </DrawerClose>
        <Button
          onClick={handleSave}
          disabled={saving || draft.name.trim() === ""}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </DrawerFooter>
    </DrawerContent>
  );
}
