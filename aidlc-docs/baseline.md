# KeepItSimple baseline

State of `main` at `e6fd7b72` (2026-11-17). Written once when AI-DLC was adopted; extend it when a task teaches you something about an area. Conventions are not repeated here: see `.claude/skills/{backend,frontend,workflow}/SKILL.md`.

## 1. Purpose

- Personal finance app: pockets (accounts), transactions, category rules, analytics, Excel reports (`README.md`).
- Every row is owned by a user (see section 6).

## 2. Stack, run, test, build

- Backend: ASP.NET Core `net10`, EF Core, PostgreSQL (Npgsql), Identity, EPPlus (reports), NPOI (test fixtures) (`backend/README.md`).
- Frontend: Next.js 16, React 19, Tailwind 4, bun (`README.md`, `frontend/package.json`).
- Infra: `docker-compose.yml` = postgres (5432), pgadmin (5050), mailpit (SMTP 1025, UI 8025).

| Task | Command | Source |
|---|---|---|
| Whole stack | `process-compose up` (docker, then `dotnet watch` API :5264, then `bun ci && bun run dev` :3000) | `process-compose.yml`, `README.md` |
| DB only | `docker compose --env-file .env up -d` | `README.md` |
| Backend dev | `cd backend/KeepItSimple.Api && dotnet watch` | `README.md` |
| Backend CI | `dotnet restore KeepItSimple.sln`, `dotnet format --verify-no-changes`, `dotnet build KeepItSimple.sln --configuration Release --no-restore`, `dotnet test KeepItSimple.sln --configuration Release --no-restore` | `.github/workflows/backend.yml` |
| Frontend CI | `bun ci`, `bun run lint`, `bun run build` (in `frontend/`) | `.github/workflows/frontend.yml`, `frontend/package.json` |

- The frontend needs env `API_BASE_URL`; the build fails without it (`frontend/next.config.ts`).
- Other workflows: `.github/workflows/claude.yml`, `claude-code-review.yml`.
- `process-compose.yml` has a `#TODO MIGRATIONS` placeholder: no auto-migrate step.

## 3. Domain model

Entities are active records (static persistence methods) in `backend/KeepItSimple.Api/models/`.

| Entity | Key fields | Relations / ownership |
|---|---|---|
| `Pocket` (`models/Pocket.cs`) | Id, Name, Balance, Currency (default EUR) | `UserId` (JsonIgnore); has many Transactions |
| `Transaction` (`models/Transaction.cs`) | Id (null = create), Description, Amount, Date, Category (`TransactionCategory` enum, includes `Transfer`), PocketId | Owned via `Pocket.UserId` (no own UserId) |
| `CategoryRule` (`models/CategoryRule.cs`) | Name, Enabled, SortOrder, GroupLogic (And/Or), Groups (jsonb: groups of conditions with Field, Operator, Value, Logic) | `UserId` |
| `KeepItSimpleUser` (`models/auth/`) | extends `IdentityUser`; PasswordChangedAt; profile picture (`ProfilePicture.cs`) | Identity user |
| `RefreshToken` (`models/auth/RefreshToken.cs`) | UserId, SessionId, UserAgent, SessionCreatedAt, TokenHash, ExpiresAt, RevokedAt, ReplacedByHash | One row per rotation; the sessions list is built from these (`helpers/SessionList.cs`) |
| `Notification` (`models/notifications/`) | UserId?, Channel (email/in-app), Recipient, Subject, Body, Status, Attempts, LastError, NextAttemptAt, SentAt | Outbox delivered by the dispatcher |
| `InAppNotification` | UserId, Title, Body, CreatedAt, ReadAt | User-owned |
| `ImportReminderSetting` | UserId, Enabled, Frequency, DayOfWeek, DayOfMonth, TimeOfDay, TimeZone, SendEmail, Message, NextRunAt | User-owned |
| `Report` (`models/reports/Report.cs`) | UserId, Period (month/quarter/year), PeriodStart/End, Label, FileName, SizeBytes, Data (xlsx bytes) | User-owned, stored in the DB |

- Analytics types (`models/analytics/`: Overview, Income, Expense, Saving) are computed, not stored.
- There is no ImportMapping entity on `main`: the mapping travels in the preview request (`backend/docs/TransactionImportFlow.md`).

## 4. Key flows (trigger, files, result)

- **Auth/session.** `POST /api/auth/{register,confirm-email,resend-confirmation,forgot-password,reset-password,login,change-password,refresh,logout}`, `GET /me`, `GET/DELETE /sessions`. Files: `controllers/AuthController.cs`, `helpers/AuthSetup.cs`, `helpers/IdentitySetup.cs`, `models/auth/TokenService.cs`, `frontend/proxy.ts`, `frontend/lib/fetchWrapper.ts`, `frontend/lib/dal.ts`, `frontend/lib/actions/auth.ts`. Result: JWT in HttpOnly cookies `kis_access` / `kis_refresh`; every endpoint requires an authenticated user by default; `proxy.ts` refreshes an expired access token before render; the browser calls relative `/api/...`, rewritten to `API_BASE_URL`. Docs: `backend/docs/Accounts.md`.
- **Transaction import.** Upload in the import dialog, then `POST /api/transactions/import/analyze` (file to sessionId + columns), `/import/preview` (mapping + pocketId to drafts + per-row errors, rules applied), `/import/confirm` (insert, update pocket balance, drop session). Files: `controllers/TransactionController.cs`, `helpers/TransactionImporter.cs`, `frontend/app/(app)/transactions/import/` (`ImportStepper.tsx`, `steps/`), `frontend/stores/transactionImport/`. Formats: xls, xlsx, xlsm, csv. Docs: `backend/docs/TransactionImportFlow.md`, `TransactionImportUtil.md`.
- **Category rules.** Rules page, then `/api/category-rules` CRUD, `PUT /reorder`, `POST /preview`, `POST /apply` (date range). Files: `controllers/CategoryRuleController.cs`, `models/CategoryRule.cs`, `helpers/CategoryRuleMatcher.cs`, `helpers/CategoryRuleJson.cs`, `frontend/app/(app)/transactions/rules/`. Result: categories set on import preview or on existing rows. Docs: `backend/docs/CategoryRules.md`, `CategoryRuleMatcher.md`.
- **Transfer between pockets.** `POST /api/transactions/transfer` calls `Transaction.CreateTransfer` and creates two transactions (outgoing negative, incoming positive), both `Category = Transfer`. Rejects the same pocket or an amount <= 0. Analytics excludes `Transfer` (`models/analytics/Analytics.cs`).
- **Analytics.** `GET /api/analytics/{overview,income,expense,saving}`. Files: `controllers/AnalyticsController.cs`, `models/analytics/Analytics.cs` (`Get*Async` load, `Build*` are pure), `frontend/stores/analytics/`, `frontend/app/(app)/{dashboard,analytics}/`.
- **Report export (Excel).** `POST /api/reports`, `GET /api/reports`, `GET /{id}/download`, `DELETE /{id}`. Files: `controllers/ReportController.cs`, `helpers/ReportCalculator.cs` (pure numbers), `helpers/ReportPeriodRange.cs`, `helpers/ReportWorkbook.cs` (EPPlus), `models/reports/`, `frontend/app/(app)/reports/`, `frontend/lib/models/Report.ts`. Result: a stored `.xlsx` row comparing the last complete month/quarter/year with the one before. Limits in `backend/docs/Reports.md`: UTC dates, mixed currencies summed with no FX conversion, max 50 stored reports per user, EPPlus non-commercial license.
- **Notifications and reminders.** Features call `NotificationManager.Enqueue*Async` (`models/notifications/NotificationManager.cs`), which writes an outbox row. `backgroundServices/NotificationDispatcher.cs` polls and delivers through `INotificationChannel` (`EmailChannel.cs`, `InAppChannel.cs`). `backgroundServices/ReminderScheduler.cs` polls due `ImportReminderSetting` rows, queues a reminder linking to `<Frontend BaseUrl>/transactions` and computes the next run (`helpers/ReminderSchedule.cs`). Both are hosted services registered in `helpers/NotificationSetup.cs`. API: `GET /api/notifications`, `/unread-summary`, `POST /{id}/read`, `GET/PUT /settings/import-reminder`. Frontend: `frontend/stores/notifications/`, `frontend/app/(app)/account/notifications/`. Docs: `backend/docs/Notifications.md`.
- **Account.** `GET/PUT/DELETE /api/account/picture` (`controllers/AccountController.cs`).
- **Pockets and transactions CRUD.** `/api/pocket`, `/api/transactions` (bulk `DELETE`, `GET pocket/{pocketId}`).

## 5. Where things live

Backend (`backend/KeepItSimple.Api/`)
- `controllers/`: HTTP only (Account, Analytics, Auth, CategoryRule, Notification, Pocket, Report, Transaction).
- `models/`: entities and static persistence; subfolders `auth/`, `analytics/`, `reports/`, `notifications/` (with `channels/`).
- `dtos/<Domain>/`: Auth, CategoryRule, Notification, Report, Transaction.
- `helpers/`: pure logic and setup (importer, matcher, `TransactionQuery`, report calc/workbook, `KeepItSimpleContext`, `KeepItSimpleDbContext`, `*Setup`, `EmailTemplates`, `CurrencyHelper`, `ClaimsPrincipalExtensions.GetUserId`).
- `backgroundServices/`: `NotificationDispatcher.cs`, `ReminderScheduler.cs`.
- `settings/`: options classes bound from appsettings.
- `Migrations/`: EF Core, 20 migrations (2026-05-06 `create_transaction_table` to 2026-11-01 `AddReports`) and `KeepItSimpleDbContextModelSnapshot.cs`.
- `backend/Tests/KeepItSimple.Api.Tests/`: account, analytics, auth, categoryRules, notifications, ownership, reports, support, transactionImport, transactionQuery.
- `backend/docs/`: feature notes (Accounts, CategoryRuleMatcher, CategoryRules, Notifications, Reports, TransactionImportFlow, TransactionImportUtil).

Frontend (`frontend/`)
- `app/`: public routes `login`, `forgot-password`, `reset-password`, `confirm-email`; authenticated group `(app)/` with `dashboard`, `analytics`, `transactions` (+ `rules/`, `import/`), `pockets`, `reports`, `account` (+ `notifications/`). `(app)/layout.tsx` wraps `UserIdentityProvider` and `NotificationsProvider`.
- `components/{ui,common,sidebar,notifications}/`: primitives, shared widgets, navigation shell.
- `stores/{analytics,notifications,transactionImport,userIdentity}/`: React context stores.
- `lib/models/` (Account, Analytics, Auth, CategoryRule, Notification, Pocket, Report, Session, Transaction), `lib/actions/auth.ts`, `lib/helpers/`, `lib/fetchWrapper.ts`, `lib/dal.ts`.
- `hooks/`, `proxy.ts`, `docs/Notifications.md`.

## 6. Invariants and gotchas

- **Per-user isolation** (backend skill): static model methods on owned data take `string userId` and filter by it; transactions via `t.Pocket!.UserId == userId`; never `FindAsync` on them; update never copies `UserId` from the body; another user's row behaves like a missing one; controllers pass `User.GetUserId()`. Tests: `backend/Tests/KeepItSimple.Api.Tests/ownership/`.
- Controllers do not query EF and take no DbContext. Open contexts only via `KeepItSimpleContext.Context.WithDbContextAsync`. No repository or service layer.
- Schema change means a new EF migration. Never edit shipped migrations or the snapshot by hand.
- Enums go over the wire as strings (`JsonStringEnumConverter`) but are stored as integers. Navigation properties are `[JsonIgnore]`.
- Notifications are never sent from a controller: queue via `NotificationManager`, the dispatcher delivers on its next poll. Long-running services live in `backgroundServices/`.
- `ReminderScheduler` relies on `KeepItSimpleContext.InitContext` running before `app.Run`, and loads all due rows at once (`shortcut:` comment in the file).
- Tests: pure helpers and `Build*` methods are tested in memory without Postgres. Excel/CSV fixtures come from `ExcelFixtureGenerator`, are never committed, and the generated folder is deleted after a passing run. Test names: `Method_condition_expected`.
- Auth tokens live only in HttpOnly cookies, never in localStorage or sessionStorage (frontend skill).
- `dotnet format --verify-no-changes` is enforced in CI.
- Changing a complex feature means updating its `backend/docs/*.md` (or `frontend/docs/`). READMEs change only when what they describe changes.

## 7. In flight at adoption (old `feature/<issue>-<slug>` stacks, not converted)

| Issue | Stack | State |
|---|---|---|
| #91 Custom categories | PRs 227, 229, 242, 243, 244 (1/5 to 5/5) | draft, not merged. Adds a Categories table and API, moves rules/import/analytics to category ids, drops the enum |
| #225 Import column mappings | PRs 228, 230 (1/2, 2/2) | draft, not merged. Adds saved mappings (API, import dialog) |
| #67 Excel reports | branch `feature/67-report-api` | in progress; `AddReports` migration is already on `main` |
| #245 Budgeting | none | open issue, no work yet |

Until #91 and #225 merge, sections 3 and 4 describe the older enum categories and the mapping-less import.

## 8. Not verified

- DB migration auto-apply on startup or in dev (`process-compose.yml` has a TODO).
- Test DB limits: tests appear to run without a real DB.
- Frontend tests: no test script in `frontend/package.json`.
- Import session storage (in-memory or persisted) and its expiry.
- Token lifetimes, rate limits, notification retry and backoff values.
- Frontend `components/` internals and per-page component trees (only the top level was read).
- The full `TransactionCategory` enum list.
