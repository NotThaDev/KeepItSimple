# KeepItSimple – Backend

ASP.NET Core Web API (`net10`) that powers KeepItSimple: pockets, transactions, analytics, file-based transaction import, and category rules.

## Stack

- **ASP.NET Core** + controllers
- **EF Core** + **PostgreSQL** (Npgsql)
- **Swagger** in Development
- **Docker Compose** at repo root for Postgres

## Layout

```
backend/
├── README.md                 ← this file
├── KeepItSimple.Api/
│   ├── controllers/          ← HTTP endpoints
│   ├── dtos/                 ← import + category-rule request / response types
│   ├── helpers/              ← TransactionImporter, CategoryRuleMatcher, DB access, currency
│   ├── models/               ← domain entities (Active Record style)
│   ├── Migrations/
│   └── Program.cs
└── Tests/
    └── KeepItSimple.Api.Tests/
```

## Domains

| Area | Routes | Notes |
|------|--------|--------|
| Pockets | `/api/pocket` | Accounts with balance / currency |
| Transactions | `/api/transactions` | CRUD, filter by pocket, and file import |
| Category rules | `/api/category-rules` | User-defined categorization (groups = parentheses) |
| Analytics | `/api/analytics` | Aggregations over transactions |

Persistence goes through `KeepItSimpleDbContext`; app code typically uses the static `KeepItSimpleContext` helper to open a scoped DbContext.

## Transaction import

Bank/export files (`.xls` / `.xlsx` / `.xlsm` / `.csv`) have **unknown layouts**. The API discovers columns, the user maps them onto `MappableField` values, drafts are previewed, then saved.

Docs inside the API project:

- **[TransactionImportUtil.md](./KeepItSimple.Api/TransactionImportUtil.md)** – how `TransactionImporter` works (analyze / preview / confirm)
- **[TransactionImportFlow.md](./KeepItSimple.Api/TransactionImportFlow.md)** – UI ↔ API conversation: file → columns → map → save

```mermaid
flowchart LR
  BE[Backend README] --> Util[TransactionImportUtil]
  BE --> Flow[TransactionImportFlow]
  BE --> Rules[CategoryRules]
  BE --> Matcher[CategoryRuleMatcher]
  Util -.-> Flow
  Flow -.-> Util
  Rules -.-> Matcher
  Matcher -.-> Rules
  Flow -.-> Rules
```

## Category rules

Users define rules that set a transaction category from description, amount, pocket, and optionally the category already resolved (for example from an import column). Without a category condition, a rule only matches `Other`. Groups stand in for parentheses; AND/OR is explicit on the group and between groups.

Docs inside the API project:

- **[CategoryRules.md](./KeepItSimple.Api/CategoryRules.md)** – UI ↔ API: create rules, import preview, apply to existing rows
- **[CategoryRuleMatcher.md](./KeepItSimple.Api/CategoryRuleMatcher.md)** – how `CategoryRuleMatcher` evaluates the tree

## Tests

`dotnet test KeepItSimple.sln` from the repo root.

`KeepItSimple.Api.Tests` covers `TransactionImporter.Analyze` / `Preview` (no database) and `CategoryRuleMatcher` (pure).

Excel/CSV fixtures are **not committed**. `ExcelFixtureGenerator` writes them with NPOI into the test output directory (`bin/.../transactionImports`) when the test run starts. After a successful run the folder is deleted; if a test fails the files are left there so they can be inspected.

## Run (dev)

1. Start Postgres (`docker compose` from repo root).
2. Set `ConnectionStrings:PostgresConnection` in `KeepItSimple.Api/appsettings.json` (or user secrets).
3. `dotnet run --project KeepItSimple.Api`
4. Swagger UI when `ASPNETCORE_ENVIRONMENT=Development`.
