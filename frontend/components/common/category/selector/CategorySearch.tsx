import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { type CategoryGroup } from "./utils";
import { CategoryGroupList } from "./CategoryGroupList";

export function CategorySearch({
  query,
  selectingItemRef,
  onQueryChange,
}: {
  query: string;
  selectingItemRef: React.RefObject<boolean>;
  onQueryChange: (query: string) => void;
}) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const shouldRestoreFocusRef = useRef(false);
  const restoreFocus = useCallback(() => {
    const input = searchInputRef.current;
    if (
      !shouldRestoreFocusRef.current ||
      !input?.isConnected ||
      selectingItemRef.current
    ) {
      return;
    }
    shouldRestoreFocusRef.current = false;
    if (document.activeElement !== input) {
      input.focus();
    }
  }, [selectingItemRef]);

  useEffect(() => {
    const timer = window.setTimeout(restoreFocus, 0);
    return () => window.clearTimeout(timer);
  }, [query, restoreFocus]);

  return (
    <div className="sticky top-0 z-10 bg-popover p-1 pb-2">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={searchInputRef}
          value={query}
          onChange={(event) => {
            shouldRestoreFocusRef.current = true;
            onQueryChange(event.target.value);
          }}
          onKeyDown={(event) => {
            const isTypingKey =
              event.key === "Backspace" ||
              event.key === "Delete" ||
              event.key.length === 1;
            if (
              isTypingKey &&
              !event.metaKey &&
              !event.ctrlKey &&
              !event.altKey
            ) {
              event.stopPropagation();
            }
          }}
          placeholder="Search categories..."
          aria-label="Search categories"
          className="pl-8 select-text"
          style={{ userSelect: "text" }}
        />
      </div>
    </div>
  );
}

export function CategorySearchResults({ groups }: { groups: CategoryGroup[] }) {
  if (groups.length === 0) {
    return (
      <p className="px-2 py-6 text-center text-sm text-muted-foreground">
        No categories match
      </p>
    );
  }

  return (
    <div className="max-h-72 overflow-y-auto">
      <CategoryGroupList groups={groups} />
    </div>
  );
}
