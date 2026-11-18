# Bolt 1/4: Report schedules backend and notification link (#215)

- **Status:** planned
- **PR:** -
- **Branch:** `intent-215/bolt-1`
- **Base:** `intent-215/intent`

## Goal

A user can create, list, edit and delete report schedules through the API, a background job generates the due reports at the user's local time, and the "report ready" notification carries a link to the new report.

## Done when

- `GET`/`PUT` `/api/reports/schedules` and `DELETE /api/reports/schedules/{period}` work and are user-scoped; unknown time zone or period gives 400.
- `ReportScheduler` generates the right period for the user's local date, skips at 50 reports with a notice, advances `NextRunAt` before generating, and handles a missing user.
- `InAppNotification.Link` exists, is path-only validated, and the notifications API returns it.
- `dotnet test`, `dotnet format --verify-no-changes` and the build pass; docs and the backend skill are updated.

## Work

Read for style first: `models/notifications/ImportReminderSetting.cs`, `helpers/ReminderSchedule.cs`, `backgroundServices/ReminderScheduler.cs`, `helpers/NotificationSetup.cs`, `models/notifications/NotificationManager.cs`, `models/notifications/InAppNotification.cs`, `controllers/ReportController.cs`, `controllers/NotificationController.cs`, `models/reports/Report.cs`, `helpers/ReportPeriodRange.cs`, `helpers/EmailTemplates.cs`, `helpers/KeepItSimpleDbContext.cs`.

1. `ReportSchedule` entity in `models/reports/` (`Id`, `UserId`, `NextRunAt` are `[JsonIgnore]`). In `KeepItSimpleDbContext`: `DbSet`, unique index (`UserId`, `Period`), index on `NextRunAt`, cascade FK, in `OnModelCreating`.
2. Nullable `Link` (`LinkMaxLength` constant, `HasMaxLength` in `OnModelCreating`, path-only validation) on the outbox `Notification` and on `InAppNotification`; thread it through `NotificationManager.EnqueueAsync`/`EnqueueInAppAsync` (optional trailing parameter), `InAppChannel` and `InAppNotification.CreateAsync` (callers: `InAppChannel`, `ownership/OwnershipTests.cs`, `notifications/InAppNotificationTests.cs` must still compile). The list endpoint returns the entity, so `link` appears with no DTO change.
3. One migration for the schedules table and both `Link` columns: `dotnet ef migrations add AddReportSchedules` from the API project (never by hand); commit the `.Designer.cs` and the snapshot.
4. Generalize `helpers/ReminderSchedule.cs`: extract `NextRunUtc(timeZone, timeOfDay, matches, afterUtc)` (the old `NextRunUtc(ImportReminderSetting, afterUtc)` calls it, existing reminder tests stay green) and raise the scan limit above 366 days. Add the report-schedule matcher (first day of month, quarter or year). Keep the DST-gap behavior.
5. `Report.CreateAsync(period, userId, utcNow, DateTime? periodDate = null)`: `periodDate` goes only to `ReportPeriodRange.Resolve`; `utcNow` keeps driving `CreatedAt`, `FileName` and the calculator (confirm how `ReportCalculator.Calculate` uses it). Leave `Resolve` unchanged. Existing callers (`ReportController.Create`, report tests) stay as they are.
6. `ReportSchedule` static methods, all filtered by `userId`: `GetAllAsync`, `UpsertAsync` (validate period and time zone, never copy `UserId`), `DeleteAsync`, `GetDueAsync`, `SetNextRunAsync`.
7. Endpoints on `ReportController` (`PUT` maps `ArgumentException` to 400, like the import reminder). `Period` has a per-property `JsonStringEnumConverter`; validate with `Enum.IsDefined` on the PUT body and the DELETE route value (copy the `ImportReminderSetting` `Validate`/`Normalize` pattern, trimmed time zone). Routes do not clash with `{id}` (checked: no GET/PUT `{id}`, DELETE has two segments).
8. `NotificationManager.EnqueueReportReadyAsync` (link `/reports?highlight=<id>`, email with the absolute link) and `EnqueueReportLimitReachedAsync`; `EmailTemplates.ReportReadyTitle` and `ReportReady`.
9. `ReportScheduler` plus `AddHostedService` in `NotificationSetup`. The run method is `internal` and takes `nowUtc`. `shortcut:` comments for the single-instance assumption and serial processing.
10. Tests (xUnit, EF InMemory, `Method_condition_expected`): next-run computation (before and after the chosen time on a period start, DST gap, UTC+1 at 00:30 resolving the right period), one schedule per period, quarterly and yearly only on their months, limit skip, missing user, run several days late, defaults (empty list), upsert twice edits, link validation (`//x`, `https://x`, empty), the link survives the outbox into the in-app row, deleting a report leaves its notification readable, the email link is built from `FrontendSettings.BaseUrl` like `ReminderScheduler` does, an undefined period number gives 400, deleting a user removes the schedules (also check the account-deletion path runs fine with pockets restricted), another user cannot read, change or delete a schedule. Advance-before-generate ordering is not observable in InMemory: covered by code review.
11. Docs: `backend/docs/Notifications.md` (single-instance limit, link), `backend/docs/Reports.md` (schedules); backend skill if the structure changes.

## Out of scope

UI, `.xlsx` attachment, auto-deleting reports, several schedules per period, download from the notification.

## Outcome

<Filled in the bolt PR.>

## Decisions

<Dated one-liners made while building.>
