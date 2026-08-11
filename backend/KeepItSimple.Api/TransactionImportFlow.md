# TransactionImportFlow

End-to-end conversation between UI and API: **file → columns → map → save**.

**Helper details:** [TransactionImportUtil.md](./TransactionImportUtil.md)  
**Backend overview:** [../README.md](../README.md)

---

## Big picture

```mermaid
flowchart LR
  A[File<br/>xls / xlsx / csv] --> B[Columns<br/>discovered headers]
  B --> C[Map<br/>column → field]
  C --> D[Preview<br/>draft transactions]
  D --> E[Save<br/>confirm & persist]
```

The user never dumps raw Excel into the database. Each step is an explicit API round-trip so the UI can show progress, let the user choose mappings, and review drafts before write.

---

## Sequence (UI ↔ API)

```mermaid
sequenceDiagram
  actor User
  participant UI
  participant API as TransactionImportController
  participant Helper as TransactionImport
  participant DB as PostgreSQL

  User->>UI: Uploads bank export
  UI->>API: POST /analyze (multipart file)
  API->>Helper: Analyze(stream, fileName)
  Helper->>Helper: Detect header (≥3 consecutive strings)
  Helper->>Helper: Store rows in session
  Helper-->>API: sessionId + columns + samples
  API-->>UI: AnalyzeResponse

  User->>UI: Maps each column → Date / Amount / … / Ignore
  UI->>API: POST /preview (sessionId + mapping + pocketId)
  API->>Helper: Preview(request)
  Helper->>Helper: Build draft Transaction list
  Helper-->>API: drafts + per-row errors
  API-->>UI: PreviewResponse

  User->>UI: Reviews / edits drafts, confirms
  UI->>API: POST /confirm (sessionId + pocketId + transactions)
  API->>Helper: Confirm(request)
  Helper->>DB: Insert transactions, update pocket balance
  Helper->>Helper: Drop session
  Helper-->>API: savedCount + entities
  API-->>UI: ConfirmResponse
```

---

## Step by step

### 1. File → columns (`analyze`)

```mermaid
flowchart TD
  U[Upload .xls / .xlsx / .csv] --> R[Open with ExcelDataReader]
  R --> S[Scan rows from top]
  S --> H{Row has ≥3 consecutive<br/>non-empty strings?}
  H -->|No| S
  H -->|Yes| C[Collect ALL string cells<br/>on that row as columns]
  C --> D[Read following rows as data]
  D --> OUT[Return sessionId,<br/>columns, sampleRows,<br/>mappableFields]
```

**UI responsibility:** render each discovered column and let the user pick a target field (`Ignore`, `Description`, `Amount`, `Date`, `Category`). Sample rows help disambiguate labels like `"Data di erogazione"`.

| Excel column | User maps to |
|--------------|--------------|
| Data di erogazione | `Date` |
| Causale | `Description` |
| Importo | `Amount` |
| Valuta | `Ignore` |

---

### 2. Columns → map → drafts (`preview`)

```mermaid
flowchart TD
  M[User mapping + pocketId] --> V{Valid mapping?<br/>Amount + Date required,<br/>no duplicates}
  V -->|No| Err[400 Bad Request]
  V -->|Yes| L[Load session rows]
  L --> B[For each row: BuildTransaction]
  B --> OK[Draft Transaction list]
  B --> RE[Row errors collected separately]
  OK --> RES[PreviewResponse]
  RE --> RES
```

**UI responsibility:** show the draft table, surface row errors, allow edits (amount sign, category, drop a line) before confirm.

Nothing is written to the database yet.

---

### 3. Map → save (`confirm`)

```mermaid
flowchart TD
  T[Edited draft transactions] --> P[Load Pocket by pocketId]
  P -->|Missing| NF[404]
  P -->|OK| W[For each draft:<br/>insert Transaction,<br/>balance += amount]
  W --> S[SaveChanges]
  S --> X[Remove in-memory session]
  X --> DONE[Return saved entities]
```

**UI responsibility:** call confirm only after explicit user confirmation; then refresh the transaction list / pocket balance from the normal CRUD APIs.

---

## State machine

```mermaid
stateDiagram-v2
  [*] --> Idle
  Idle --> Analyzed: POST /analyze
  Analyzed --> Previewed: POST /preview
  Previewed --> Previewed: POST /preview again\n(same session, new mapping)
  Previewed --> Saved: POST /confirm
  Analyzed --> Idle: process restart\n(session lost)
  Previewed --> Idle: process restart
  Saved --> Idle: session removed
```

---

## Endpoints cheat sheet

| Step | Method | Path | Body |
|------|--------|------|------|
| File → columns | `POST` | `/api/transactions/import/analyze` | `multipart`: `file` |
| Columns → map | `POST` | `/api/transactions/import/preview` | JSON: `sessionId`, `pocketId`, `mapping`, `defaultCategory?` |
| Map → save | `POST` | `/api/transactions/import/confirm` | JSON: `sessionId`, `pocketId`, `transactions` |

---

## Minimal happy path

1. User uploads `estratto.xlsx`
2. API returns columns `Data`, `Descrizione`, `Importo`, `Saldo`
3. User maps Data→`Date`, Descrizione→`Description`, Importo→`Amount`, Saldo→`Ignore`
4. API returns N draft transactions (and maybe a few row errors)
5. User confirms → N rows in `Transactions`, pocket balance updated
