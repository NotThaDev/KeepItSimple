"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCategoryColors } from "@/lib/helpers/colors";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/models/Category";
import { useCategories, type CategoryGroup } from "@/stores/categories";
import { getCategoryIcon } from "../iconRegistry";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  categoryIdFromItemValue,
  filterCategoryGroups,
  groupIdForCategory,
  selectItemValue,
} from "./utils";
import { CategoryGroupList } from "./CategoryGroupList";
import { CategorySearch, CategorySearchResults } from "./CategorySearch";
import { CategorySelectItem } from "./CategorySelectItem";

interface TransactionCategorySelectorProps {
  categoryId?: number;
  isInvalid?: boolean;
  className?: string;
  isIncome?: boolean;
  showAll?: boolean;
  onChange: (categoryId: number) => void;
  // Adds a "clear" item and lets `category` be undefined (e.g. "All categories" in filters).
  onClear?: () => void;
  clearLabel?: string;
}

const CLEAR_ITEM_VALUE = "__clear__";

export function CategorySelector({
  categoryId: selectedCategoryId,
  isIncome = false,
  showAll = false,
  isInvalid,
  className,
  onChange,
  onClear,
  clearLabel = "All categories",
}: Readonly<TransactionCategorySelectorProps>) {
  const { other, byId, groups: groupsFor } = useCategories();
  const isCleared = onClear !== undefined && selectedCategoryId === undefined;
  const category = byId(selectedCategoryId ?? other.id);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeGroupId, setActiveGroupId] = useState<string>();
  const selectingItemRef = useRef(false);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      releaseStuckPointerEvents();
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [open]);
  const tab = showAll ? "all" : isIncome ? "income" : "expense";
  const groups = useMemo(() => groupsFor(tab), [groupsFor, tab]);
  const isSearching = query.trim().length > 0;
  const filteredGroups = useMemo(
    () => filterCategoryGroups(groups, query),
    [groups, query],
  );
  const initialGroupId = isCleared
    ? groups[0]?.id
    : groupIdForCategory(groups, category.id);
  const activeGroup =
    groups.find((group) => group.id === activeGroupId) ??
    groups.find((group) => group.id === initialGroupId) ??
    groups[0];
  const renderedGroups = isSearching
    ? filteredGroups
    : activeGroup
      ? [activeGroup]
      : [];
  const selectedGroupId =
    !isSearching && activeGroup?.categories.some((c) => c.id === category.id)
      ? activeGroup.id
      : groupIdForCategory(groups, category.id);
  const selectedItemValue = isCleared
    ? CLEAR_ITEM_VALUE
    : selectItemValue(selectedGroupId, category.id);
  const selectionVisible = isCleared || renderedGroups.some(
    (group) =>
      group.id === selectedGroupId &&
      group.categories.some((c) => c.id === category.id),
  );

  return (
    <CategorySelect
      groups={groups}
      value={isCleared ? undefined : category}
      clearLabel={clearLabel}
      open={open}
      onChange={(next) => (next ? onChange(next.id) : onClear?.())}
      isInvalid={isInvalid}
      className={className}
      selectedItemValue={selectedItemValue}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          setQuery("");
          setActiveGroupId(initialGroupId);
          return;
        }
        releaseStuckPointerEvents();
      }}
      content={
        <SelectContent
          position="popper"
          align="start"
          data-vaul-no-drag=""
          className="w-(--radix-select-trigger-width) max-w-96 min-w-72 p-2 !overflow-hidden [&_[data-radix-select-viewport]]:!h-auto [&_[data-radix-select-viewport]]:!min-w-0 [&_[data-radix-select-viewport]]:!w-full"
          onPointerDownCapture={(event) => {
            const target = event.target;
            selectingItemRef.current =
              target instanceof Element &&
              Boolean(target.closest("[data-slot=select-item]"));
          }}
          onPointerUp={() => {
            selectingItemRef.current = false;
          }}
        >
          <CategorySearch
            query={query}
            selectingItemRef={selectingItemRef}
            onQueryChange={setQuery}
          />
          {onClear ? (
            <SelectItem value={CLEAR_ITEM_VALUE}>{clearLabel}</SelectItem>
          ) : null}
          {selectionVisible ? null : (
            <SelectItem value={selectedItemValue} className="!hidden">
              {category.name}
            </SelectItem>
          )}
          {isSearching ? (
            <CategorySearchResults groups={filteredGroups} />
          ) : (
            <CategoryGroupPanel
              groups={groups}
              activeGroup={activeGroup}
              onGroupSelect={setActiveGroupId}
            />
          )}
        </SelectContent>
      }
    />
  );
}

function releaseStuckPointerEvents() {
  window.setTimeout(() => {
    if (document.querySelector("[data-slot='drawer-content']")) return;
    if (document.body.style.pointerEvents === "none") {
      document.body.style.pointerEvents = "";
    }
  }, 600);
}

function CategorySelect({
  groups,
  value,
  clearLabel,
  open,
  onChange,
  isInvalid,
  placeholder,
  className,
  selectedItemValue,
  onOpenChange,
  content,
}: {
  groups: CategoryGroup[];
  value?: Category;
  clearLabel?: string;
  open?: boolean;
  onChange: (category?: Category) => void;
  isInvalid?: boolean;
  placeholder?: string;
  className?: string;
  selectedItemValue?: string;
  onOpenChange?: (open: boolean) => void;
  content?: React.ReactNode;
}) {
  const { byId } = useCategories();
  const colors = value ? createCategoryColors(value.color) : undefined;
  const itemValue =
    selectedItemValue ??
    (value
      ? selectItemValue(groupIdForCategory(groups, value.id), value.id)
      : CLEAR_ITEM_VALUE);

  return (
    <Select
      open={open}
      value={itemValue}
      onOpenChange={onOpenChange}
      onValueChange={(next) => {
        if (next === CLEAR_ITEM_VALUE) {
          onChange(undefined);
          return;
        }
        const id = categoryIdFromItemValue(next);
        if (id !== undefined) {
          onChange(byId(id));
        }
      }}
    >
      <SelectTrigger
        aria-invalid={isInvalid}
        className={cn(
          "w-full min-w-0 font-normal dark:bg-transparent dark:hover:bg-transparent [&_svg]:text-current *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate",
          className,
        )}
        style={
          colors && {
            backgroundColor: colors.foreground,
            color: colors.background,
            borderColor: colors.background,
          }
        }
      >
        <SelectValue placeholder={placeholder ?? "Select a Category"}>
          {value ? value.name : clearLabel}
        </SelectValue>
      </SelectTrigger>
      {content ?? (
        <SelectContent position="popper" align="start" className="max-h-72">
          <CategoryGroupList groups={groups} />
        </SelectContent>
      )}
    </Select>
  );
}

function CategoryGroupPanel({
  groups,
  activeGroup,
  onGroupSelect,
}: {
  groups: CategoryGroup[];
  activeGroup?: CategoryGroup;
  onGroupSelect: (groupId: string) => void;
}) {
  return (
    <div className="grid max-h-72 min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-1">
      <nav
        aria-label="Category groups"
        className="max-h-72 min-w-0 overflow-y-auto overscroll-contain border-r pr-1"
        onKeyDown={(event) => {
          const isTypingKey =
            event.key === "Backspace" ||
            event.key === "Delete" ||
            event.key.length === 1;
          if (isTypingKey && !event.metaKey && !event.ctrlKey && !event.altKey) {
            event.stopPropagation();
          }
        }}
      >
        {groups.map((group) => {
          const Icon = getCategoryIcon(group.icon);
          const isActive = group.id === activeGroup?.id;

          return (
            <button
              key={group.id}
              type="button"
              aria-pressed={isActive}
              className={cn(
                "flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
                "hover:bg-accent hover:text-accent-foreground",
                isActive && "bg-accent text-accent-foreground",
              )}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => onGroupSelect(group.id)}
            >
              <Icon className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{group.label}</span>
            </button>
          );
        })}
      </nav>
      <SelectGroup className="max-h-72 min-w-0 overflow-y-auto overscroll-contain p-0">
        {activeGroup?.categories.map((category) => (
          <CategorySelectItem
            key={category.id}
            category={category}
            itemValue={selectItemValue(activeGroup.id, category.id)}
          />
        ))}
      </SelectGroup>
    </div>
  );
}
