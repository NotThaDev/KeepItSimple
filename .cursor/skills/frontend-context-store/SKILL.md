---
name: frontend-context-store
description: >-
  Create React context stores with Action + State types under frontend/stores.
  Use when adding a context, store, provider, or moving feature logic and API
  calls out of UI components.
---

# Frontend context store

KeepItSimple frontend contexts live in `frontend/stores`, at the same level as `hooks`. They own logic and API calls. Components only render.

## Base structure

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

## Types

In `types.ts`:

```ts
export interface FeatureContextState {
  // raw + derived data the UI reads
}

export interface FeatureContextAction {
  // functions the UI calls
}

export type FeatureContext = FeatureContextState & FeatureContextAction;
```

Name them `<Feature>ContextState`, `<Feature>ContextAction`, `<Feature>Context`.

- State: values, loading flags, derived lists/totals.
- Action: event handlers, setters, API workflows. No React state setters leaked unless they are the public action.

## Provider and hook

In `<Feature>Context.tsx`:

- `"use client"`
- `createContext<FeatureContext | null>(null)`
- `<Feature>Provider` owns `useState` / `useMemo` / `useCallback`
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

Re-export provider, hook, and types from `index.ts`.

## What belongs where

**Store**

- API calls (`get` / `post` / `put` / `del` from `@/lib/models`)
- Validation before requests
- Toast / error mapping
- Derived state (`useMemo`)
- Workflow (reset, step changes, open/close)

**Components**

- Layout, copy, tables, inputs
- `useFeatureContext()` then bind to JSX
- No fetch, no business rules, no duplicated derived data

Wrap the feature UI with the provider at the feature root (dialog, page section). Nested components consume the hook instead of prop-drilling logic.

## Do not

- Put contexts under `app/` or `components/`
- Put fetch or toast workflows in step/presentational components
- Mix unrelated features in one store folder
- Skip Action / State split or the `State & Action` context type
