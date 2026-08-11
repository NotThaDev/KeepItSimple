# TransactionImportUtil

Implementation reference for [`helpers/TransactionImport.cs`](./helpers/TransactionImport.cs).

**Controller:** [`controllers/TransactionImportController.cs`](./controllers/TransactionImportController.cs)  
**Product flow (UI conversation):** [TransactionImportFlow.md](./TransactionImportFlow.md)  
**Backend overview:** [../README.md](../README.md)

---

## Purpose

POC that imports bank/export files whose layout is **unknown in advance**. The UI never assumes fixed column names: the API discovers headers, the user maps them onto `Transaction` fields, drafts are previewed, then saved.

Supported formats: `.xls`, `.xlsx`, `.xlsm`, `.csv` (via [ExcelDataReader](https://github.com/ExcelDataReader/ExcelDataReader)).

Logic lives in `TransactionImport` (static methods + nested DTOs). The controller only validates HTTP input and maps exceptions to status codes. Sessions live in a process-local `ConcurrentDictionary` (POC: lost on restart / multi-instance).

---

## Public surface

| Method                      | Role                                                                  |
| --------------------------- | --------------------------------------------------------------------- |
| `Analyze(Stream, fileName)` | Open file, find header row, cache data rows, return columns + samples |
| `Preview(PreviewRequest)`   | Apply user column mapping → draft `Transaction` list                  |
| `Confirm(ConfirmRequest)`   | Persist drafts, update pocket balance, drop session                   |

Mappable target fields (`MappableFields`):

- `Ignore` – skip column
- `Description`
- `Amount` (**required** in mapping)
- `Date` (**required** in mapping)
- `Category` – optional; must match `Transaction.TransactionCategory` enum name

`PocketId` is never taken from the file: the UI supplies it on preview/confirm.

---

## Step 1 – `Analyze` in detail

1. Registers code-page encodings once (needed for legacy `.xls`).
2. Copies the upload into a seekable `MemoryStream` (ExcelDataReader requirement).
3. Opens a reader:
   - `.csv` → `CreateCsvReader` with auto-detected separators `,` `;` tab `|`
   - otherwise → `CreateReader` (OLE2 / OpenXML)
4. **Header detection** (not “first row”):
   - Scans rows from the top.
   - A row is a header when it contains **at least 3 consecutive cells** whose value is a **non-empty `string`** (numbers/dates do not count).
   - Rationale: a real statement header always includes at least date, description/causale, amount.
5. On that row, **every** non-empty string cell becomes an `ExcelColumn` (`Index` 1-based, `Name` = cell text). Empty cells are skipped.
6. All following non-empty data rows are stored in the session as `Dictionary<columnIndex, string>`.
7. Returns `AnalyzeResponse`:
   - `sessionId` – opaque handle for preview/confirm
   - `columns` – discovered headers
   - `sampleRows` – first 5 data rows (keyed by column name)
   - `mappableFields` – allowed mapping targets

```mermaid
flowchart TD
  A[Upload stream] --> B[Seekable buffer]
  B --> C{Extension?}
  C -- .csv --> D[CreateCsvReader]
  C -- .xls/.xlsx --> E[CreateReader]
  D --> F[Scan rows]
  E --> F
  F --> G{≥3 consecutive<br/>non-empty strings?}
  G -- No --> F
  G -- Yes --> H[Collect all string headers on row]
  H --> I[Cache remaining data rows]
  I --> J[Return sessionId + columns + samples]
```

If no header row is found → `InvalidOperationException` → HTTP 400.

---

## Step 2 – `Preview` in detail

1. Loads the in-memory session by `sessionId` (missing → 404).
2. `ValidateMapping`:
   - at least one column mapped to `Amount`
   - at least one column mapped to `Date`
   - no duplicate non-`Ignore` targets
3. For each cached data row, `BuildTransaction`:
   - walks the mapping; `Ignore` skipped
   - `ParseAmount` – strips `€`/spaces; handles `1.234,56` and `1,234.56`
   - `ParseDate` – common EU/US formats, `it-IT`, invariant, Excel OA date serial
   - `Category` – enum parse, else `defaultCategory` (default `Other`)
4. Successful rows → `transactions`; failures → `errors` like `"Row N: …"` (drafts are still returned).

Nothing is written to the DB here. The UI may edit drafts before confirm.

```mermaid
flowchart TD
  M[PreviewRequest] --> S{Session exists?}
  S -- No --> NF[404]
  S -- Yes --> V{Mapping valid?}
  V -- No --> BR[400]
  V -- Yes --> L[For each cached row]
  L --> B[BuildTransaction]
  B --> OK[transactions]
  B --> ER[errors]
  OK --> R[PreviewResponse]
  ER --> R
```

---

## Step 3 – `Confirm` in detail

1. Resolves `Pocket` by `pocketId` (missing → 404).
2. For each draft in the request body:
   - clears `Id`
   - sets `PocketId` / navigation
   - `pocket.Balance += amount`
   - `Add` to `Transactions`
3. Single `SaveChangesAsync`.
4. Removes the import session from memory.
5. Returns `savedCount` + persisted entities.

Balance semantics match the rest of the app: negative amount = expense, positive = income.

```mermaid
flowchart TD
  R[ConfirmRequest] --> P[Find Pocket]
  P -- missing --> NF[404]
  P -- ok --> W[Insert each Transaction<br/>balance += amount]
  W --> S[SaveChangesAsync]
  S --> X[Remove session]
  X --> OUT[ConfirmResponse]
```

---

## HTTP endpoints

Base route: `/api/transactions/import`

| Step | Method | Path       | Input                                          |
| ---- | ------ | ---------- | ---------------------------------------------- |
| 1    | `POST` | `/analyze` | `multipart/form-data` field `file` (max 10 MB) |
| 2    | `POST` | `/preview` | JSON `PreviewRequest`                          |
| 3    | `POST` | `/confirm` | JSON `ConfirmRequest`                          |

### Example – analyze response

```json
{
  "sessionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "columns": [
    { "index": 1, "name": "Data di erogazione" },
    { "index": 2, "name": "Causale" },
    { "index": 3, "name": "Importo" },
    { "index": 4, "name": "Valuta" }
  ],
  "sampleRows": [
    {
      "Data di erogazione": "01/03/2026",
      "Causale": "Stipendio",
      "Importo": "2500.00",
      "Valuta": "EUR"
    }
  ],
  "mappableFields": ["Ignore", "Description", "Amount", "Date", "Category"]
}
```

### Example – preview request

```json
{
  "sessionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "pocketId": 1,
  "defaultCategory": "Other",
  "mapping": [
    { "columnIndex": 1, "targetField": "Date" },
    { "columnIndex": 2, "targetField": "Description" },
    { "columnIndex": 3, "targetField": "Amount" },
    { "columnIndex": 4, "targetField": "Ignore" }
  ]
}
```

### Example – confirm request

```json
{
  "sessionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "pocketId": 1,
  "transactions": [
    {
      "description": "Stipendio",
      "amount": 2500.0,
      "date": "2026-03-01T00:00:00Z",
      "category": "Salary",
      "pocketId": 1
    }
  ]
}
```

---

## POC limits

- Sessions are **in-memory only** (not shared across instances; cleared on restart).
- Only the **first sheet** is read.
- Header detection requires true `string` cells for the 3-consecutive rule (Excel numeric cells do not qualify).
- No duplicate-transaction detection / idempotency.
- No auth on the import endpoints yet.
