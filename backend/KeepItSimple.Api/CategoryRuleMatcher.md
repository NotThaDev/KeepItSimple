# CategoryRuleMatcher

Implementation reference for [`helpers/CategoryRuleMatcher.cs`](./helpers/CategoryRuleMatcher.cs).

**Controller:** [`controllers/CategoryRuleController.cs`](./controllers/CategoryRuleController.cs) (`/api/category-rules`)  
**Model:** [`models/CategoryRule.cs`](./models/CategoryRule.cs)  
**Product flow (UI conversation):** [CategoryRules.md](./CategoryRules.md)  
**Backend overview:** [../README.md](../README.md)

---

## Purpose

Evaluate user-defined categorization rules against a **transaction snapshot** (`description`, `amount`, **already resolved** `category`, `pocketId`). The matcher is a pure helper: no I/O. Callers load enabled rules ordered by `SortOrder` and pass them in.

Used from:

- `TransactionImporter.Preview` — after `TryParseCategory` (enum + Italian aliases)
- `CategoryRule.PreviewApplyAsync` / `ApplyAsync` — saved rows, category only

First matching **enabled** rule wins. Evaluation never chains: the snapshot is the original description / amount / category / pocket, not a previous rule’s output.

A rule matches regardless of the snapshot category. A category condition in the formula is an extra filter, not a requirement.

---

## Public surface

| Method | Role |
|--------|------|
| `FindMatch(description, amount, category, rules, pocketId = 0)` | First matching rule, or `null` |
| `IsOperatorAllowed(field, operator)` | Operator whitelist per field (used by validation) |

`CategoryRule` CRUD / reorder / apply live on the model (same Active Record style as `Pocket`).

---

## Rule tree

```mermaid
flowchart TD
  rule["CategoryRule groupLogic"]
  g1["Group of conditions"]
  c1["Condition field operator value"]
  c2["Later condition also has logic"]
  target[TargetCategory]
  rule --> g1
  rule --> target
  g1 --> c1
  g1 --> c2
```

- `groupLogic`: `And` or `Or` between groups. One operator for the whole rule, so mixed infix `A AND B OR C` cannot appear at this level.
- Inside a group, each condition after the first has its own `logic`. Evaluation is left to right: `A OR B AND C` is `(A OR B) AND C`.
- The first condition's `logic` is ignored and stripped on save.
- A group does not have its own `logic`. Operators live on each condition after the first. `POST /api/category-rules/backfill-condition-logic` rewrites stored JSON that still has `logic` beside `conditions`.
- Empty groups / empty condition lists do not match.

Persisted as jsonb on `CategoryRules.Groups`. Shared serializer: [`helpers/CategoryRuleJson.cs`](./helpers/CategoryRuleJson.cs) (camelCase properties, string enums, omit null `logic`).

---

## Matching in detail

```mermaid
flowchart TD
  R[Enabled rules by sortOrder] --> N{Next rule?}
  N -- No --> Null[null]
  N -- Yes --> G[Evaluate groups with groupLogic]
  G --> Hit{Matches?}
  Hit -- No --> N
  Hit -- Yes --> Win[Return that rule]
```

1. Skip `Enabled == false`.
2. Combine group results with `groupLogic` (`And` → all groups, `Or` → any group).
3. A group with one condition is that condition. Further conditions fold in left to right with their own `logic` (`And` or `Or`). A missing connector is `And`.
4. Return the rule (caller reads `TargetCategory`). Later rules are not applied to this snapshot.

### Conditions

| Field | Operators | Notes |
|-------|-----------|--------|
| `Description` | `Contains`, `Equals` | Trim, case-insensitive. `Contains` matches a whole word (so `ENI` does not match `Enoteca`). Null/blank description never matches |
| `Amount` | `Gt`, `Gte`, `Lt`, `Lte`, `Eq` | Invariant decimal. Signed: expenses are negative |
| `Category` | `Equals`, `NotEquals` | Parsed as `TransactionCategory`. This is the category **before** the rule override. Omit it and the rule still matches any category |
| `Pocket` | `Equals`, `NotEquals` | Value is the pocket id as a decimal-free integer string. Import uses the session pocket |

Invalid operator/field pairs fail validation on save and do not match at runtime.

---

## Import wiring

`TransactionImporter.Preview(request, rules)` is still synchronous. The controller loads rules then passes them in:

```
POST /import/preview
  → CategoryRule.GetEnabledOrderedAsync()
  → TransactionImporter.Preview(request, rules)
  → BuildTransaction → TryParseCategory → CategoryRuleMatcher.FindMatch
```

Tests can call `Preview` without rules (default empty list): existing import tests stay DB-free.

---

## HTTP (service)

Base route: `/api/category-rules`

Create/update run `Normalize()` then `Validate()`:

- Name required
- At least one group, each with at least one condition
- each condition after the first needs `logic` (`And` or `Or`)
- Amount values must parse; category values must be a known enum; pocket values must be a positive integer id

`PUT /reorder` assigns `SortOrder` `0..n-1` from the id list (top of the UI list is `0`).

`POST /preview-apply` filters by optional `pocketId`, `from`, and `to` (same day bounds as the transaction list), then re-evaluates at call time. `POST /apply` takes the previewed ids and skips a row if the match is missing or the target is already the current category.

---

## Tests

`KeepItSimple.Api.Tests/categoryRules/CategoryRuleMatcherTests.cs` — no database.

Covers AND groups, mixed `And`/`Or` inside one group (left to right), `groupLogic: And` with an inner OR group (`Amount > 0 AND (equals OR contains)`), OR between groups, first-match `sortOrder`, disabled rules, case-insensitive description, existing category, rules without a category condition apply to every category, pocket equals/not equals, blank description.

Import: `Preview_applies_the_first_matching_category_rule` in `transactionImport/PreviewTests.cs`.
