---
name: frontend
description: >-
  Implement KeepItSimple frontend features: Next.js App Router pages, component
  folders, shared UI, lib/models API functions, and React context stores. Use
  when adding or changing frontend pages, components, drawers, tables, forms,
  selectors, API models, contexts, stores, or providers under frontend/. When
  the user asks for a frontend structure change, update this skill so it matches
  the new structure.
---

# Frontend

KeepItSimple UI is a Next.js App Router app in `frontend/`. Import with the `@/` alias (`frontend/*`). Domain types and HTTP live in `lib/models`. Components render. Multi-step logic and shared feature state live in `frontend/stores`.

## Keep this skill current

When the user asks for a change to frontend structure, update this file in the same change. Structure means folders, how components are split, the page pattern, model and API shape, shared UI conventions, or store layout.

A new screen that follows the rules already written here does not need a skill edit. If the requested change replaces a rule, rewrite that section so it describes the new structure and drop the old one.

## Documentation

When you add or change a complex feature, update its feature markdown in the same change. Complex means a multi-step flow, matching rules, import, or other behavior that is hard to see from the code alone. A simple screen that only lists or edits one entity does not need its own markdown.

The overview README stays at the top of the app folder (`frontend/README.md`, `backend/README.md`). Feature notes go in that app's `docs/` folder.

If a feature markdown already exists, update it. Backend notes today are `backend/docs/CategoryRules.md`, `CategoryRuleMatcher.md`, `TransactionImportFlow.md`, and `TransactionImportUtil.md`. If the feature is complex and has none, add one under `frontend/docs/` when the note is about the UI, or `backend/docs/` when it is about the API. A flow doc covers the UI and API conversation. A helper doc covers pure logic that needs its own explanation. Link a new doc from that app's top-level README.

Also update the overview README whose contents the change affects:

- `README.md` — "What you can do" and "In the app" when a user-facing area is added or its behavior changes.
- `frontend/README.md` — the page table, stack, or how to run the UI.
- `backend/README.md` — domains, layout, feature-doc links, tests, or how to run the API.

Leave an overview README alone when the change does not alter what that file describes.

## Folder map

```
frontend/
  README.md                   # overview of pages and how to run the UI
  docs/                       # notes for a complex screen
  app/<feature>/              # route and the UI only that route uses
    page.tsx                  # server: load data, wrap the page
    <Feature>PageContent.tsx  # client: local UI state
    <region>/                 # table, drawer, steps, or view
      utils.ts                # helpers used only in this folder
  components/
    ui/                       # shadcn primitives
    common/                   # widgets used by more than one feature
    sidebar/                  # nav shell and RouteDefinition.ts
  stores/<feature>/           # context: Action + State
  hooks/                      # hooks shared across features
  lib/
    fetchWrapper.ts           # get, post, put, del
    models/<Domain>.ts        # types, enums, API functions
    helpers/                  # formatting and small pure helpers
```

Feature UI stays under its route (`app/transactions/rules/`). Move a component to `components/common/` only when a second feature needs it. Add a page that should appear in the nav to `components/sidebar/RouteDefinition.ts`.

`NavigationMenu` mounts the desktop sidebar and the mobile header and bottom nav together. The server does not know the viewport, so do not mount only one of them. `md:hidden` and `hidden md:block` choose which one is visible.

## Page split

`page.tsx` is an async server component and the only default export.

1. Await `searchParams` (`Promise<Record<string, string | string[] | undefined>>`).
2. Load with model functions. Independent loads use `Promise.all`.
3. Wrap the page in `PageWrapper`.
4. Pass each `FetchWrapperResponse` into `<Feature>PageContent`.

`<Feature>PageContent` is `"use client"`. It owns open/close state, selection, toasts, and the table or view switch. If `"error" in response`, toast a load failure and render from `response.data ?? []` (or an `EmptyStateCard` when there is nothing to show). After a successful mutation, toast and call `router.refresh()`.

Wrap the page in a store provider when children share a workflow (analytics, transaction import). Those children call the store hook instead of receiving handlers for every step.

## Component division

One exported component per file. The file name is the export (`RuleDrawerContent.tsx` exports `RuleDrawerContent`). Declare `interface <Name>Props` above the component and type the parameter as `Readonly<Props>`.

Give a region its own folder when it has more than one file:

| Region | Folder | What goes in it |
| --- | --- | --- |
| List | `<feature>Table/` | `getXColumns` in `*Columns.tsx`, row action buttons |
| Editor | `<feature>Drawer/` | `*DrawerContent.tsx`, rows, `selectors/`, `utils.ts` |
| Wizard | `steps/<step>/` | one step component, plus pieces only that step uses |
| Alternate screen | `<view>/` | `*View.tsx` and the cards that belong to that view |

Extract a child when it has its own props (a condition row, a field select, a chart card). Leave one-off markup in the parent.

`*Columns.tsx` exports `getXColumns(...)`, built with `createColumnHelper<DataTableFeatures, T>()`. The page content renders `DataTable` with those columns.

Put draft builders, validation, and labels that only one folder uses in that folder's `utils.ts` (or a sibling `*Labels.ts`). Put them on the model only when other features or the request body need them.

Add `"use client"` only on files that use state, events, or browser APIs.

## Models and API

One file per domain in `frontend/lib/models/` (`Transaction.ts`, `Pocket.ts`, `CategoryRule.ts`, `Analytics.ts`):

- Interfaces and string enums matching the API (`TransactionCategory.Food = "Food"`).
- Constants and pure helpers that define the domain (`OPERATORS_BY_FIELD`, `normalizeRuleGroups`).
- Async functions that call `get`, `post`, `put`, or `del` from `@/lib/fetchWrapper` and return `Promise<FetchWrapperResponse<T>>`.

```ts
export async function getPockets(): Promise<FetchWrapperResponse<Pocket[]>> {
  return await get<Pocket[]>("/api/pocket");
}
```

- Endpoint paths stay in the model file.
- When the JSON body is not the UI type, map it in a private function in that file (`ruleRequestBody`).
- Turn API date strings into `Date` before returning.
- URL list filters live beside the list function: `parseXSearchParams` and `toXSearchParams`.

Components and stores import `@/lib/models/...`. They do not call `fetch` or build endpoint strings.

On the client, branch on `response.error`, toast `` `Failed to …: ${response.error}` ``, and return. Do not throw for an expected API error.

## UI to reuse

Use these before adding a new primitive:

- `components/ui/*` — button, input, field, drawer, dialog, select, switch, table, card, tooltip
- `PageWrapper` — title, optional `extraContent`, page padding
- `DataTable` — lists; pass `onPageChange` when the page is server-driven
- `Selection` — select from `{ value, label }[]`
- `EmptyStateCard` — no data, with `actionHref` or `onAction`
- `ConfirmationDialogContent` — destructive confirm inside `Dialog`
- `DatePicker`, `DateRangePicker`, `ENGLISH_DATE_FORMATTER` from `components/common/DateUtils`
- `CategoryBadge` — transaction category
- `formatAmount` from `lib/helpers/currencyHelper`
- `toast` from `sonner`
- Icons from `lucide-react`
- `cn` from `@/lib/utils` when merging classes

Forms use `Field`, `FieldGroup`, and `FieldLabel`. Drawers open to the right: `Drawer` and `DrawerTrigger` live in the page content; `*DrawerContent` renders `DrawerContent` (header, scrollable body, footer). Set `aria-invalid` from local validation state.

## Stores

Use a store for a workflow (steps, derived data shared by many children, several coordinated API calls). A single create, update, or delete on a page content component may call the model function directly.

Contexts live in `frontend/stores`, at the same level as `hooks`. They own logic and API calls. Components only render.

Tipi: Action + State.
Folder: stores.
Devono tenere la logica e le chiamate alle API lasciando ai componenti solo il compito di mostrare.

```
frontend/stores/<feature>/
  types.ts
  <Feature>Context.tsx
  index.ts
  utils.ts            # optional helpers used only by the store
```

Canonical example: `frontend/stores/transactionImport/`.

In `types.ts`, name the types `<Feature>ContextState`, `<Feature>ContextAction`, and `<Feature>Context`:

```ts
export interface FeatureContextState {
  // raw + derived data the UI reads
}

export interface FeatureContextAction {
  // functions the UI calls
}

export type FeatureContext = FeatureContextState & FeatureContextAction;
```

- State: values, loading flags, derived lists and totals.
- Action: event handlers, setters, API workflows. Do not leak a React state setter unless it is the public action.

In `<Feature>Context.tsx`:

- `"use client"`
- `createContext<FeatureContext | null>(null)`
- `<Feature>Provider` owns `useState`, `useMemo`, and `useCallback`
- `use<Feature>Context()` throws if used outside the provider
- Memoize the context value
- Import domain models from `@/lib/models`, not from UI folders

```ts
export function useFeatureContext() {
  const context = useContext(FeatureContext);
  if (!context) {
    throw new Error("useFeatureContext must be used within FeatureProvider");
  }
  return context;
}
```

Re-export the provider, hook, and types from `index.ts`.

**Store:** API calls (`get`, `post`, `put`, `del` from `@/lib/models`), validation before requests, toast and error mapping, derived state (`useMemo`), and workflow (reset, step changes, open and close).

**Components:** layout, copy, tables, and inputs. Call `use<Feature>Context()` and bind the result to JSX. No fetch, no business rules, no duplicated derived data.

Wrap the feature UI with the provider at the feature root (dialog or page section). Nested components use the hook instead of prop-drilling that state.

## Do not

- Put single-feature UI in `components/`
- Recreate a primitive that already exists in `components/ui`
- Put endpoint strings or `fetch` in components
- Default-export anything except `page.tsx`
- Add a sidebar page without an entry in `RouteDefinition.ts`
- Duplicate derived lists in a child that the parent or the store already computed
- Put contexts under `app/` or `components/`
- Put fetch or toast workflows in step or presentational components
- Mix unrelated features in one store folder
- Skip the Action / State split or the `State & Action` context type
- Leave a complex feature change undocumented when its markdown exists, or skip creating one when the feature is new and complex
- Rewrite `README.md`, `frontend/README.md`, or `backend/README.md` for a change that does not alter what that file describes
