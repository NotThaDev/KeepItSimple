# Intent: Scheduled Excel reports with ready notification (#215)

- **Issue:** #215 (follow-up to #67)
- **Status:** draft
- **Depth:** deep (new user data, a background job, email)

## Why

Reports exist (#67) but only by hand from the Reports page. A user who wants a monthly, quarterly or yearly report has to remember to generate it. This adds an opt-in schedule that generates the previous period's report on the 1st and tells the user when it is ready.

Blockers from the issue are resolved: the notification system (#114: `NotificationManager`, channels, `ReminderScheduler`) and the Reports API and page (#67: `Report.CreateAsync`, `ReportPeriodRange`, Reports page) are on `main`.

## Questions and answers

| Question | Answer |
|---|---|
| Base for this intent PR | On top of PR #248 (`docs/aidlc-baseline`), because the aidlc templates are not on `main` yet. Retarget to `main` when #248 merges. |
| PR naming for this trial | Every PR title starts with `TEST AI-DLC:` |
| Run time | Fixed: 02:00 UTC on the 1st of the period. No per-user time or time zone. |
| What the user chooses | Three independent checkboxes: Monthly, Quarterly, Yearly (any combination) plus "Also send email". |
| Where the setting lives | Notifications settings tab, next to the import reminder. A hint in the Reports page empty state links to it. |

## Scope

**In:**
- One schedule setting per user: Monthly, Quarterly, Yearly, SendEmail.
- A background scheduler that generates the due reports with `Report.CreateAsync(period, userId, utcNow)`.
- One in-app notification per generated report (text points to the Reports page; no link field, see Decisions), plus an email with a link to `/reports` when enabled and the address is confirmed.
- One in-app notification when a report is skipped because the user has 50 reports.
- Settings card in the Notifications tab and the empty-state hint on the Reports page.

**Out:**
- Attaching the `.xlsx` to the email (link only, the file stays behind auth).
- Custom periods, custom run day or time, per-user time zone.
- Deleting old reports automatically (retention is #115/#116).

## Behavior

- The user ticks Monthly, Quarterly and/or Yearly and optionally "Also send email". Helper text: "Generated on the 1st of each period at 02:00 UTC".
- On the 1st at 02:00 UTC the reports for the period that just closed appear on the Reports page and the user gets an in-app notification ("Your {label} report is ready. Open Reports to download it.") and, if enabled, an email with a link.
- At 50 stored reports nothing is generated or deleted; the user gets one notification asking to delete some.
- Turning all three off stops the schedule. Turning it on does not generate anything immediately: the first run is the next 1st.

## Design

**Data**
- New entity `ReportScheduleSetting` in `models/notifications/`, active-record style like `ImportReminderSetting`: `Id`, `UserId` (both `[JsonIgnore]`), `Monthly`, `Quarterly`, `Yearly`, `SendEmail`, `NextRunAt` (`[JsonIgnore]`, UTC, null when all flags are off).
- Static methods take `userId` and filter by it: `GetAsync`, `UpsertAsync` (never copies `UserId` from the body), `GetDueAsync(nowUtc)`, `SetNextRunAsync(id, next)`.
- `DbSet` plus the unique index on `UserId`, an index on `NextRunAt` and the cascade FK to the user live in `helpers/KeepItSimpleDbContext.cs` (`OnModelCreating`), like `ImportReminderSetting`. One new EF migration generated with `dotnet ef migrations add`; commit the `.Designer.cs` and the snapshot with it.
- `Id`, `UserId` and `NextRunAt` stay `[JsonIgnore]`, so a request body cannot set them. The PUT takes only booleans, so there is nothing else to validate.

**API** (on `NotificationController`, next to the import reminder)
- `GET /api/notifications/settings/report-schedule`: the setting, or all-false defaults when no row exists.
- `PUT /api/notifications/settings/report-schedule`: upsert, returns the saved setting, recomputes `NextRunAt`.

**Scheduler** (`backgroundServices/ReportScheduler.cs`, same pattern as `ReminderScheduler`)
- `PeriodicTimer` on `NotificationSettings.ReminderPollSeconds`; errors logged per tick.
- Loads due rows once, processes them in `Chunk(BatchSize)`, loading users per batch.
- Per row: **advance `NextRunAt` first, then generate**. A crash skips one run instead of generating twice.
- `NextRunAt` = 02:00 UTC on the 1st of the month **after the current UTC month**, both when the user saves the setting and after a run. So enabling on the 1st at 01:00 does not run that same day.
- Missing user (race between loading rows and users): `SetNextRunAsync(id, null)`. A deleted user's row is normally removed by the cascade.
- A server down over the 1st catches up on the next tick of the same month; `utcNow` is the real run time so the same period resolves. If the server is down for the whole month, that period is skipped: no backfill.
- Single API instance is assumed, like the notification dispatcher (`backend/docs/Notifications.md`, Limits). Two instances could both read a due row and generate twice. This is documented, not guarded (`shortcut:` comment, upgrade to a conditional `UPDATE ... WHERE NextRunAt = <old>` if the app is ever scaled out).
- Rows run one after another inside a tick. `Report.CreateAsync` loads all of a user's transactions, and every opted-in user is due at the same moment, so a tick can be long; the next tick just waits. `shortcut:` comment, do not parallelize.
- Testability: the run method is `internal` and takes `nowUtc` (like the other helpers), so tests call it directly. The advance-before-generate ordering cannot be observed with the EF InMemory provider the tests use; it is covered by code review.
- Which reports a run produces, from the UTC month of `now`: Monthly gives `LastMonth` every run; Quarterly gives `LastQuarter` in months 1, 4, 7, 10; Yearly gives `LastYear` in month 1.
- Each `CreateAsync` is in its own try/catch: one failure does not block the other periods or the next user.
- Limit: check `Report.CountAsync(userId)` against `Report.MaxPerUser` (50) before each generation; at the limit skip that report and notify in-app. Never delete reports.

**Notifications**
- `NotificationManager.EnqueueReportReadyAsync(user, report, sendEmail, link)`: in-app always (`EnqueueInAppAsync(userId, title, body)`, no link: `InAppNotification` has no link field); email only when `sendEmail` and the user's email is confirmed and set (same rule as the import reminder), and only the email carries `link`.
- `NotificationManager.EnqueueReportLimitReachedAsync`: in-app only.
- `EmailTemplates.ReportReadyTitle` and `EmailTemplates.ReportReady(userName, label, link)`; link = `FrontendSettings.BaseUrl + "/reports"`.

**Security and ownership:** the setting is user-owned; another user's row behaves like a missing one; the scheduler only generates for the row's own `UserId`. Tests cover both.

**Limits kept from #67:** UTC calendar periods; mixed-currency totals as in Analytics.

## Bolts

| # | Bolt | Layer | Depends on |
|---|---|---|---|
| 1 | [bolt-1](bolt-1.md) | backend | intent approved |
| 2 | [bolt-2](bolt-2.md) | ui | bolt 1 |

## Verify

1. `dotnet test`, `dotnet format --verify-no-changes`, build, frontend lint and build pass.
2. Browser (isolated DB, test user): tick Monthly, save, reload, the state persists.
3. Force `NextRunAt` to the past (SQL) with a short poll interval: a report for the previous month appears on `/reports` with an in-app notification.
4. Quarterly and Yearly only produce reports in months 1, 4, 7, 10 and month 1 (unit tests).
5. Email arrives in Mailpit only when "Also send email" is on and the address is confirmed.
6. With 50 reports the run skips generation, notifies, deletes nothing.
7. All flags off clears `NextRunAt`.
8. 375 px: no horizontal scroll in the new card.

## Decisions

- 2026-11-17: fixed 02:00 UTC run, three checkboxes, setting in the Notifications tab (owner's answers).
- 2026-11-17: enabling the schedule does not generate anything immediately; the first run is the next 1st.
- 2026-11-17: the in-app notification has no link (no link field exists and adding one needs a migration plus UI). Its text says to open the Reports page; the email has the link. Veto this in review if a clickable in-app link is wanted: it adds a column and frontend rendering.
- 2026-11-17: missed periods are skipped, not backfilled; single API instance assumed (see Design).
- 2026-11-17: this is the first intent run with the aidlc workflow; PR titles carry the `TEST AI-DLC:` prefix.
