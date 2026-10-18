import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useRef } from "react";
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
  const isTypingRef = useRef(false);

  return (
    <div className="sticky top-0 z-10 bg-popover p-1 pb-2">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => {
            isTypingRef.current = true;
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
            } else {
              // Arrow keys, Tab, Enter, Escape: let Radix move focus to the items.
              isTypingRef.current = false;
            }
          }}
          onBlur={(event) => {
            // Radix Select refocuses the selected item whenever it remounts (e.g. when
            // the search hides it), stealing focus mid-typing. Take it back.
            const input = event.currentTarget;
            const content = input.closest("[data-slot=select-content]");
            if (
              isTypingRef.current &&
              !selectingItemRef.current &&
              content?.contains(event.relatedTarget)
            ) {
              input.focus();
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
