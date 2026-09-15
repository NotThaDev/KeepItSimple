# KeepItSimple – Backend

ASP.NET Core Web API (`net10`) that powers KeepItSimple: pockets, transactions, analytics, and file-based transaction import.

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
│   ├── helpers/              ← shared utilities (DB access, import, currency)
│   ├── models/               ← domain entities (Active Record style)
│   ├── Migrations/
│   └── Program.cs
└── tests/
    ├── data/                 ← fixtures shared by every test project
    └── KeepItSimple.Api.Tests/
```

## Domains

| Area | Routes | Notes |
|------|--------|--------|
| Pockets | `/api/pocket` | Accounts with balance / currency |
| Transactions | `/api/transactions` | CRUD + filter by pocket |
| Analytics | `/api/analytics` | Aggregations over transactions |
| Import | `/api/transactions/import` | Multi-step file → transaction flow |

Persistence goes through `KeepItSimpleDbContext`; app code typically uses the static `KeepItSimpleContext` helper to open a scoped DbContext.

## Transaction import

Bank/export files (`.xls` / `.xlsx` / `.csv`) have **unknown layouts**. The API discovers columns, the user maps them, drafts are previewed, then saved.

Docs inside the API project:

- **[TransactionImportUtil.md](./KeepItSimple.Api/TransactionImportUtil.md)** – how the helper works (analyze / preview / confirm)
- **[TransactionImportFlow.md](./KeepItSimple.Api/TransactionImportFlow.md)** – UI ↔ API conversation: file → columns → map → save

```mermaid
flowchart LR
  BE[Backend README] --> Util[TransactionImportUtil]
  BE --> Flow[TransactionImportFlow]
  Util -.-> Flow
  Flow -.-> Util
```

## Tests

`dotnet test KeepItSimple.sln` from the repo root.

`KeepItSimple.Api.Tests` currently covers the import helper's `Analyze` and `Preview`, which are pure and need no database. The Excel fixtures they read live in `tests/data/transactionImports` and are committed as binaries; `ExcelFixtureGenerator` writes them with NPOI, so after changing a dataset rebuild them with:

```bash
REGENERATE_IMPORT_FIXTURES=1 dotnet test
```

## Run (dev)

1. Start Postgres (`docker compose` from repo root).
2. Set `ConnectionStrings:PostgresConnection` in `KeepItSimple.Api/appsettings.json` (or user secrets).
3. `dotnet run --project KeepItSimple.Api`
4. Swagger UI when `ASPNETCORE_ENVIRONMENT=Development`.
