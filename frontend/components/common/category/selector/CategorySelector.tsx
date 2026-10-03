"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CategoryColorMap,
  DEFAULT_CATEGORY_COLORS,
} from "@/lib/helpers/colors";
import {
  formatCategoryLabel,
  TransactionCategory,
} from "@/lib/models/Transaction";
import { cn } from "@/lib/utils";
import { MoreHorizontal } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  categoryFromItemValue,
  filterCategoryGroups,
  GROUP_ICONS,
  groupIdForCategory,
  groupsForSelector,
  selectItemValue,
  type CategoryGroup,
} from "./utils";
import { CategoryGroupList } from "./CategoryGroupList";
import { CategorySearch, CategorySearchResults } from "./CategorySearch";
import { CategorySelectItem } from "./CategorySelectItem";

interface TransactionCategorySelectorProps {
  category?: TransactionCategory;
  isInvalid?: boolean;
  className?: string;
  isIncome?: boolean;
  showAll?: boolean;
  onChange: (category: TransactionCategory) => void;
}

export function CategorySelector({
  category = TransactionCategory.Other,
  isIncome = false,
  showAll = false,
  isInvalid,
  className,
  onChange,
}: Readonly<TransactionCategorySelectorProps>) {
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
  const groups = groupsForSelector(isIncome, showAll);
  const isSearching = query.trim().length > 0;
  const filteredGroups = useMemo(
    () => filterCategoryGroups(groups, query),
    [groups, query],
  );
  const activeGroup =
    groups.find((group) => group.id === activeGroupId) ??
    groups.find((group) => group.id === groupIdForCategory(groups, category)) ??
    groups[0];
  const renderedGroups = isSearching
    ? filteredGroups
    : activeGroup
      ? [activeGroup]
      : [];
  const selectedGroupId =
    !isSearching && activeGroup?.categories.includes(category)
      ? activeGroup.id
      : groupIdForCategory(groups, category);
  const selectedItemValue = selectItemValue(selectedGroupId, category);
  const selectionVisible = renderedGroups.some(
    (group) =>
      group.id === selectedGroupId && group.categories.includes(category),
  );

  return (
    <CategorySelect
      groups={groups}
      value={category}
      open={open}
      onChange={onChange}
      isInvalid={isInvalid}
      className={className}
      selectedItemValue={selectedItemValue}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          setQuery("");
          setActiveGroupId(groupIdForCategory(groups, category));
          return;
        }
        releaseStuckPointerEvents();
      }}
      content={
        <SelectContent
          position="popper"
          align="start"
          data-vaul-no-drag=""
          className="w-(--radix-select-trigger-width) max-w-96 min-w-0 p-2 !overflow-hidden [&_[data-radix-select-viewport]]:!h-auto [&_[data-radix-select-viewport]]:!min-w-0 [&_[data-radix-select-viewport]]:!w-full"
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
          {selectionVisible ? null : (
            <SelectItem value={selectedItemValue} className="!hidden">
              {formatCategoryLabel(category)}
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
  value: TransactionCategory;
  open?: boolean;
  onChange: (category: TransactionCategory) => void;
  isInvalid?: boolean;
  placeholder?: string;
  className?: string;
  selectedItemValue?: string;
  onOpenChange?: (open: boolean) => void;
  content?: React.ReactNode;
}) {
  const colors = CategoryColorMap[value] ?? DEFAULT_CATEGORY_COLORS;
  const itemValue =
    selectedItemValue ??
    selectItemValue(groupIdForCategory(groups, value), value);

  return (
    <Select
      open={open}
      value={itemValue}
      onOpenChange={onOpenChange}
      onValueChange={(next) => {
        const category = categoryFromItemValue(next);
        if (category) {
          onChange(category);
        }
      }}
    >
      <SelectTrigger
        aria-invalid={isInvalid}
        className={cn(
          "w-full min-w-0 font-normal dark:bg-transparent dark:hover:bg-transparent [&_svg]:text-current *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate",
          className,
        )}
        style={{
          backgroundColor: colors.foreground,
          color: colors.background,
          borderColor: colors.background,
        }}
      >
        <SelectValue placeholder={placeholder ?? "Select a Category"}>
          {formatCategoryLabel(value)}
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
          const Icon = GROUP_ICONS[group.id] ?? MoreHorizontal;
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
            key={category}
            category={category}
            itemValue={selectItemValue(activeGroup.id, category)}
          />
        ))}
      </SelectGroup>
    </div>
  );
}
