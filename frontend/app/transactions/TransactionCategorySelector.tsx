"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CategoryColorMap,
  DEFAULT_CATEGORY_COLORS,
} from "@/lib/helpers/colors";
import {
  filterCategoryGroups,
  findCategoryGroupId,
  groupsForTransactionType,
} from "@/lib/models/categoryGroups";
import {
  formatCategoryLabel,
  TransactionCategory,
} from "@/lib/models/Transaction";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  Building2,
  Car,
  CheckIcon,
  ChevronDownIcon,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  MoreHorizontal,
  Receipt,
  Search,
  ShoppingBag,
  Ticket,
  TrendingUp,
  Utensils,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import {
  KeyboardEvent,
  MutableRefObject,
  ReactNode,
  RefObject,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type TransactionCategorySelectorProps = {
  value?: TransactionCategory;
  onChange: (category: TransactionCategory) => void;
  isInvalid?: boolean;
  placeholder?: string;
  className?: string;
} & (
  | { showAll?: false; isIncome: boolean }
  | { showAll: true; isIncome?: boolean }
);

const GROUP_ICONS: Record<string, LucideIcon> = {
  "food-drink": Utensils,
  transport: Car,
  home: Home,
  shopping: ShoppingBag,
  health: HeartPulse,
  leisure: Ticket,
  education: GraduationCap,
  bills: Receipt,
  money: Wallet,
  giving: Gift,
  other: MoreHorizontal,
  work: Briefcase,
  investments: TrendingUp,
  property: Building2,
};

const PICKER_PANEL_CLASS =
  "flex w-96 max-w-[calc(100vw-1.5rem)] flex-col gap-2 rounded-lg bg-popover p-2 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10";

export function TransactionCategorySelector({
  value = TransactionCategory.Other,
  isIncome = false,
  showAll = false,
  onChange,
  isInvalid,
  placeholder,
  className,
}: Readonly<TransactionCategorySelectorProps>) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const [open, setOpen] = useState(false);
  const [inline, setInline] = useState(false);
  const [query, setQuery] = useState("");
  const [activeGroupId, setActiveGroupId] = useState<string | undefined>();
  const [highlightIndex, setHighlightIndex] = useState(0);

  const groups = useMemo(
    () => groupsForTransactionType(isIncome, showAll, value),
    [isIncome, showAll, value],
  );
  const filteredGroups = useMemo(
    () => filterCategoryGroups(groups, query),
    [groups, query],
  );
  const isSearching = query.trim().length > 0;
  const activeGroup =
    filteredGroups.find((group) => group.id === activeGroupId) ??
    filteredGroups[0];
  const visibleCategories = isSearching
    ? filteredGroups.flatMap((group) => group.categories)
    : (activeGroup?.categories ?? []);
  const searchOptionOffsets = useMemo(() => {
    const offsets = new Map<string, number>();
    let offset = 0;
    for (const group of filteredGroups) {
      offsets.set(group.id, offset);
      offset += group.categories.length;
    }
    return offsets;
  }, [filteredGroups]);

  const colors = CategoryColorMap[value] ?? DEFAULT_CATEGORY_COLORS;
  const selectedLabel = value
    ? formatCategoryLabel(value)
    : (placeholder ?? "Select a Category");

  useLayoutEffect(() => {
    setInline(Boolean(rootRef.current?.closest("[data-vaul-drawer]")));
  }, []);

  useEffect(() => {
    optionRefs.current[highlightIndex]?.scrollIntoView({ block: "nearest" });
  }, [highlightIndex, activeGroup?.id, query]);

  useEffect(() => {
    if (!open) {
      return;
    }

    searchInputRef.current?.focus();

    if (!inline) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) {
        return;
      }
      setOpen(false);
    }

    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape, true);
    };
  }, [inline, open]);

  function resetPickerState() {
    const nextGroups = groupsForTransactionType(isIncome, showAll, value);
    const nextGroupId = findCategoryGroupId(nextGroups, value);
    const nextGroup = nextGroups.find((group) => group.id === nextGroupId);
    const selectedIndex = nextGroup?.categories.indexOf(value) ?? 0;

    setQuery("");
    setActiveGroupId(nextGroupId);
    setHighlightIndex(Math.max(0, selectedIndex));
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      resetPickerState();
    }
  }

  function selectCategory(category: TransactionCategory) {
    onChange(category);
    setOpen(false);
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    event.stopPropagation();

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((current) =>
        visibleCategories.length === 0
          ? 0
          : Math.min(current + 1, visibleCategories.length - 1),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const highlighted = visibleCategories[highlightIndex];
      if (highlighted) {
        selectCategory(highlighted);
      }
    }
  }

  function handleQueryChange(nextQuery: string) {
    const nextGroups = filterCategoryGroups(groups, nextQuery);
    const nextVisible = nextQuery.trim()
      ? nextGroups.flatMap((group) => group.categories)
      : (nextGroups.find((group) => group.id === activeGroupId)?.categories ??
        nextGroups[0]?.categories ??
        []);
    const selectedVisibleIndex = nextVisible.indexOf(value);

    setQuery(nextQuery);
    setHighlightIndex(selectedVisibleIndex >= 0 ? selectedVisibleIndex : 0);
    if (nextGroups.length > 0 && nextQuery.trim()) {
      const groupWithSelection = nextGroups.find((group) =>
        group.categories.includes(value),
      );
      setActiveGroupId((groupWithSelection ?? nextGroups[0]).id);
    }
  }

  function handleGroupSelect(groupId: string) {
    const nextGroup = filteredGroups.find((group) => group.id === groupId);
    const selectedIndex = nextGroup?.categories.indexOf(value) ?? -1;

    setActiveGroupId(groupId);
    setHighlightIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }

  const trigger = (
    <Button
      type="button"
      variant="outline"
      aria-invalid={isInvalid}
      aria-expanded={open}
      aria-haspopup="listbox"
      aria-controls={listboxId}
      className={cn(
        "w-full min-w-[342px] justify-between border font-normal dark:bg-transparent dark:hover:bg-transparent [&_svg]:text-current",
        className,
      )}
      style={{
        backgroundColor: colors.foreground,
        color: colors.background,
        borderColor: colors.background,
      }}
      onClick={inline ? () => handleOpenChange(!open) : undefined}
    >
      <span className="truncate">{selectedLabel}</span>
      <ChevronDownIcon className="size-4 opacity-70" />
    </Button>
  );

  const panel = (
    <CategoryPickerPanel
      listboxId={listboxId}
      query={query}
      isSearching={isSearching}
      filteredGroups={filteredGroups}
      activeGroupId={activeGroup?.id}
      visibleCategories={visibleCategories}
      searchOptionOffsets={searchOptionOffsets}
      highlightIndex={highlightIndex}
      selectedCategory={value}
      searchInputRef={searchInputRef}
      optionRefs={optionRefs}
      onQueryChange={handleQueryChange}
      onSearchKeyDown={handleSearchKeyDown}
      onGroupSelect={handleGroupSelect}
      onSelectCategory={selectCategory}
      onHighlight={setHighlightIndex}
    />
  );

  return (
    <div ref={rootRef} className="relative w-full min-w-44">
      {inline ? (
        <>
          {trigger}
          {open ? (
            <div
              data-vaul-no-drag
              className={cn(
                PICKER_PANEL_CLASS,
                "absolute top-[calc(100%+6px)] left-0 z-50 max-w-full",
              )}
              onPointerDown={(event) => event.stopPropagation()}
            >
              {panel}
            </div>
          ) : null}
        </>
      ) : (
        <Popover modal open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          <PopoverContent
            align="start"
            sideOffset={6}
            collisionPadding={12}
            className="w-96 max-w-[calc(100vw-1.5rem)] gap-2 p-2"
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              searchInputRef.current?.focus();
            }}
          >
            {panel}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

function CategoryPickerPanel({
  listboxId,
  query,
  isSearching,
  filteredGroups,
  activeGroupId,
  visibleCategories,
  searchOptionOffsets,
  highlightIndex,
  selectedCategory,
  searchInputRef,
  optionRefs,
  onQueryChange,
  onSearchKeyDown,
  onGroupSelect,
  onSelectCategory,
  onHighlight,
}: {
  listboxId: string;
  query: string;
  isSearching: boolean;
  filteredGroups: ReturnType<typeof filterCategoryGroups>;
  activeGroupId?: string;
  visibleCategories: TransactionCategory[];
  searchOptionOffsets: Map<string, number>;
  highlightIndex: number;
  selectedCategory: TransactionCategory;
  searchInputRef: RefObject<HTMLInputElement | null>;
  optionRefs: MutableRefObject<Array<HTMLButtonElement | null>>;
  onQueryChange: (query: string) => void;
  onSearchKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onGroupSelect: (groupId: string) => void;
  onSelectCategory: (category: TransactionCategory) => void;
  onHighlight: (index: number) => void;
}) {
  let results: ReactNode;
  if (visibleCategories.length === 0) {
    results = (
      <p className="px-2 py-6 text-center text-sm text-muted-foreground">
        No categories match
      </p>
    );
  } else if (isSearching) {
    results = (
      <div
        id={listboxId}
        role="listbox"
        aria-label="Categories"
        className="max-h-72 overflow-y-auto overscroll-contain"
      >
        {filteredGroups.map((group) => {
          const groupStartIndex = searchOptionOffsets.get(group.id) ?? 0;

          return (
            <div key={group.id} className="pb-1">
              <p className="px-2 pt-2 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {group.label}
              </p>
              {group.categories.map((category, index) => {
                const optionIndex = groupStartIndex + index;
                return (
                  <CategoryOption
                    key={category}
                    optionRef={(element) => {
                      optionRefs.current[optionIndex] = element;
                    }}
                    id={`${listboxId}-option-${optionIndex}`}
                    category={category}
                    isSelected={category === selectedCategory}
                    isHighlighted={optionIndex === highlightIndex}
                    onSelect={onSelectCategory}
                    onHighlight={() => onHighlight(optionIndex)}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    );
  } else {
    results = (
      <div className="grid h-72 grid-cols-[11rem_minmax(0,1fr)] gap-1">
        <nav
          aria-label="Category groups"
          className="overflow-y-auto overscroll-contain border-r pr-1"
        >
          {filteredGroups.map((group) => {
            const Icon = GROUP_ICONS[group.id] ?? MoreHorizontal;
            const isActive = group.id === activeGroupId;

            return (
              <button
                key={group.id}
                type="button"
                aria-pressed={isActive}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive && "bg-accent text-accent-foreground",
                )}
                onClick={() => onGroupSelect(group.id)}
              >
                <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{group.label}</span>
              </button>
            );
          })}
        </nav>
        <div
          id={listboxId}
          role="listbox"
          aria-label="Categories"
          className="overflow-y-auto overscroll-contain"
        >
          {visibleCategories.map((category, index) => (
            <CategoryOption
              key={category}
              optionRef={(element) => {
                optionRefs.current[index] = element;
              }}
              id={`${listboxId}-option-${index}`}
              category={category}
              isSelected={category === selectedCategory}
              isHighlighted={index === highlightIndex}
              onSelect={onSelectCategory}
              onHighlight={() => onHighlight(index)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={searchInputRef}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={onSearchKeyDown}
          placeholder="Search categories..."
          aria-label="Search categories"
          aria-controls={listboxId}
          aria-activedescendant={
            visibleCategories[highlightIndex]
              ? `${listboxId}-option-${highlightIndex}`
              : undefined
          }
          className="pl-8"
        />
      </div>
      {results}
    </>
  );
}

function CategoryOption({
  optionRef,
  id,
  category,
  isSelected,
  isHighlighted,
  onSelect,
  onHighlight,
}: {
  optionRef?: (element: HTMLButtonElement | null) => void;
  id: string;
  category: TransactionCategory;
  isSelected: boolean;
  isHighlighted: boolean;
  onSelect: (category: TransactionCategory) => void;
  onHighlight: () => void;
}) {
  const optionColors = CategoryColorMap[category] ?? DEFAULT_CATEGORY_COLORS;

  return (
    <button
      ref={optionRef}
      id={id}
      type="button"
      role="option"
      aria-selected={isSelected}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
        "hover:bg-accent hover:text-accent-foreground",
        isHighlighted && "bg-accent text-accent-foreground",
      )}
      onClick={() => onSelect(category)}
      onMouseEnter={onHighlight}
    >
      <span
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: optionColors.background }}
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate">
        {formatCategoryLabel(category)}
      </span>
      {isSelected ? <CheckIcon className="size-4 shrink-0" /> : null}
    </button>
  );
}
