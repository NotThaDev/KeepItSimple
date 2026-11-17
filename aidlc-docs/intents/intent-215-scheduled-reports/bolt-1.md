# Bolt 1/2: Report schedule backend (#215)

- **Status:** planned
- **PR:** -
- **Branch:** `intent-215/bolt-1`
- **Base:** `intent-215/intent`

## Goal

A user can store a report schedule through the API, and a background job generates the due reports and notifies the user.

## Done when

- `GET`/`PUT /api/notifications/settings/report-schedule` work and are user-scoped.
- `ReportScheduler` generates the right periods for a given month, skips at 50 reports, advances `NextRunAt` before generating, and clears it when all flags are off.
- `dotnet test`, `dotnet format --verify-no-changes` and the build pass.
- Docs and the backend skill are updated.

## Work

Read for style first: `models/notifications/ImportReminderSetting.cs`, `backgroundServices/ReminderScheduler.cs`, `helpers/ReminderSchedule.cs`, `helpers/NotificationSetup.cs`, `models/notifications/NotificationManager.cs`, `controllers/NotificationController.cs`, `models/reports/Report.cs`, `helpers/ReportPeriodRange.cs`, `helpers/EmailTemplates.cs`.

1. `ReportScheduleSetting` entity (`Id`, `UserId`, `NextRunAt` stay `[JsonIgnore]`). In `helpers/KeepItSimpleDbContext.cs`: `DbSet`, unique index on `UserId`, index on `NextRunAt`, cascade FK, all in `OnModelCreating` like `ImportReminderSetting`. Generate the migration with `dotnet ef migrations add AddReportScheduleSettings` from the API project (never by hand); commit the `.Designer.cs` and the snapshot.
2. Pure helpers: next run = 02:00 UTC on the 1st of the month after the current UTC month; and "which periods does a run in month M produce".
3. `GetAsync`, `UpsertAsync`, `GetDueAsync`, `SetNextRunAsync`, all filtered by `userId`.
4. Endpoints on `NotificationController`; `NextRunAt` set on upsert (null when all flags off).
5. `NotificationManager.EnqueueReportReadyAsync` (in-app via `EnqueueInAppAsync`, no link; email carries the link) and `EnqueueReportLimitReachedAsync`; `EmailTemplates.ReportReadyTitle` and `ReportReady`.
6. `ReportScheduler` + `AddHostedService` in `NotificationSetup`. The run method is `internal` and takes `nowUtc` so tests can call it. Add `shortcut:` comments for the single-instance assumption and the serial processing.
7. Tests (xUnit, EF InMemory, `Method_condition_expected`): periods per month, next-run computation (including enabling on the 1st before and after 02:00), limit skip, missing user, run several days after the 1st still resolves the same period, defaults when no row, upsert with all flags off clears `NextRunAt`, another user cannot read or change the row, `ImportReminderSetting`-style cascade behavior only where InMemory can check it. Advance-before-generate ordering is not observable in InMemory: covered by code review.
8. Docs: `backend/docs/Notifications.md` (including the single-instance limit), `backend/docs/Reports.md`; backend skill if the structure changes.

## Out of scope

UI, `.xlsx` attachment, custom run time, auto-deleting reports.

## Outcome

<Filled in the bolt PR.>

## Decisions

<Dated one-liners made while building.>
