# Intent: Scheduled Excel reports with ready notification (#215)

- **Issue:** #215 (follow-up to #67)
- **Status:** draft (revised 2026-11-18 after owner feedback)
- **Depth:** deep (new user data, a background job, email, a migration)

## Why

Reports exist (#67) but only by hand from the Reports page. A user who wants a monthly, quarterly or yearly report has to remember to generate it. This lets the user schedule them from the Reports page, and tells them (and shows them where) when a report is ready.

Blockers from the issue are resolved: the notification system (#114: `NotificationManager`, channels, `ReminderScheduler`) and the Reports API and page (#67: `Report.CreateAsync`, `ReportPeriodRange`, Reports page) are on `main`.

## Questions and answers

| Question | Answer |
|---|---|
| Base for this intent PR | On top of PR #248 (`docs/aidlc-baseline`), because the aidlc templates are not on `main` yet. Retarget to `main` when #248 merges. |
| PR naming for this trial | Every PR title starts with `TEST AI-DLC:` |
| Where the setting lives | The Reports page: a **Schedule report** button opens a modal, and a list on the page shows the user's schedules to view, edit or delete. Not the Notifications tab (changed from the first draft). |
| What the user chooses | Period (every month, every quarter, every year), time of day, and "Also send email". |
| How many schedules | One per period, so at most 3 (monthly, quarterly, yearly). |
| Run time | The user picks the time of day. The time zone is the browser's, saved with the schedule, same as the import reminder. |
| Storage of scheduled reports | Scheduled reports are normal reports in the list. Nothing is deleted automatically; the user deletes them by hand. |
| Making the new report easy to find | The notification links to the Reports page and the new row is highlighted (bolt 3). Downloading from the notification is a later bolt (bolt 4). |
| Email attachment | Out of scope: the email carries a link only (see Risks in the PR). |

## Scope

**In:**
- Up to one schedule per period per user: period, time of day, time zone, SendEmail.
- A background scheduler that generates the report for the period that just closed, on the first day of the period at the chosen local time.
- An in-app notification per generated report, with a link that opens the Reports page and highlights the new row; an email with the same link when enabled and the address is confirmed.
- Reports page: "Schedule report" button, modal (create or edit), list of schedules with edit and delete.
- One in-app notification when a run is skipped because the user already has 50 reports.

**Out:**
- Attaching the `.xlsx` to the email (the file stays behind auth; the outbox stores no blobs).
- Auto-deleting reports (retention is #115/#116).
- Custom periods, custom run day (always the first day of the period), several schedules for the same period.
- Download from the notification: later bolt, not started.

## Behavior

- On the Reports page the user presses **Schedule report**, picks every month, quarter or year, a time, optionally "Also send email", and saves. A period already scheduled is edited instead of duplicated.
- A "Scheduled reports" list on the page shows each schedule (period, time, time zone, next run, email on or off) with Edit and Delete (delete asks for confirmation).
- Runs: monthly on the 1st; quarterly on 1 Jan, 1 Apr, 1 Jul, 1 Oct; yearly on 1 Jan; always at the chosen time in the user's time zone. Each run creates the report of the period that just closed.
- The user gets an in-app notification ("Your {label} report is ready"). Clicking it opens the Reports page with the new row highlighted (static tint, no animation). The email, if enabled, links to the same place.
- Saving a schedule whose first run is later the same day (for example saved on the 1st before the chosen time) runs then; otherwise the first run is the next period start.
- If the user already has 50 reports the run generates nothing, deletes nothing and sends one in-app notice asking to delete some. This stays because reports now accumulate.

## Design

**Data**
- New entity `ReportSchedule` in `models/reports/` (active record, like `ImportReminderSetting`): `Id`, `UserId`, `NextRunAt` are `[JsonIgnore]`; `Period` (`ReportPeriod`: `LastMonth`, `LastQuarter`, `LastYear`), `TimeOfDay`, `TimeZone`, `SendEmail`.
- Unique index on (`UserId`, `Period`), index on `NextRunAt`, cascade FK to the user, all in `helpers/KeepItSimpleDbContext.cs` (`OnModelCreating`) plus the `DbSet`.
- A notification reaches the in-app table through the outbox (`NotificationManager` -> `Notification.EnqueueAsync` -> `InAppChannel` -> `InAppNotification.CreateAsync`), so the link needs a path all the way: a nullable `Link` on both the outbox `Notification` and `InAppNotification` (`HasMaxLength(LinkMaxLength)` in `OnModelCreating`), threaded through as an optional trailing parameter so existing callers and tests compile unchanged.
- One migration for all of it, generated with `dotnet ef migrations add`; commit the `.Designer.cs` and the snapshot.
- `Period` uses a per-property `JsonStringEnumConverter` (as `Report.Period` does) and is checked with `Enum.IsDefined` on PUT and DELETE: a number like `7` would otherwise bind to an undefined value.
- Static methods take `userId` and filter by it: `GetAllAsync`, `UpsertAsync` (never copies `UserId` from the body, validates time zone and period), `DeleteAsync(period, userId)`, `GetDueAsync(nowUtc)`, `SetNextRunAsync`.
- `InAppNotification.Link` is validated: it must start with a single `/` (no `//`, no scheme) so a link can never point off-site.

**API** (on `ReportController`, next to the other report endpoints)
- `GET /api/reports/schedules`: the user's schedules.
- `PUT /api/reports/schedules`: upsert by the `period` in the body, recomputes `NextRunAt`, returns the saved schedule.
- `DELETE /api/reports/schedules/{period}`: deletes it; 404 when missing (another user's row behaves like a missing one).
- The notifications list returns the `InAppNotification` entity directly, so `link` appears with no DTO change.

**Scheduler** (`backgroundServices/ReportScheduler.cs`, same pattern as `ReminderScheduler`)
- `PeriodicTimer` on `NotificationSettings.ReminderPollSeconds`; errors logged per tick.
- Loads due rows once, processes them in `Chunk(BatchSize)`, loading users per batch.
- Per row: **advance `NextRunAt` first, then generate**. A crash skips one run instead of generating twice.
- `NextRunAt` = the first occurrence of (first day of the period, `TimeOfDay`, `TimeZone`) strictly after now. `ReminderSchedule.NextRunUtc` already handles time zones and DST gaps, but it is tied to `ImportReminderSetting` and only matches daily, weekly or day-of-month 1..28 within a 62-day scan. Extract a generic `NextRunUtc(timeZone, timeOfDay, matches, afterUtc)`; the old method calls it and its tests stay green. Raise the scan limit above 366 days (a yearly match can be that far away).
- The period to generate comes from the user's local date at run time, not the UTC date: a run at 00:30 in a UTC+1 zone on the 1st happens on the last UTC day of the previous month and would otherwise resolve the wrong period. Report data ranges stay UTC calendar dates (the existing limit in `backend/docs/Reports.md`). `Report.CreateAsync(period, userId, utcNow)` passes `utcNow` to `ReportPeriodRange.Resolve`, the calculator, `CreatedAt` and the file name, so a fake clock would corrupt them. Add `DateTime? periodDate = null`, passed only to `Resolve`; `utcNow` keeps driving the rest. `Resolve` stays unchanged (its tests pin it) and the existing callers (`ReportController.Create`, tests) stay as they are.
- Missing user (race between loading rows and users): `SetNextRunAsync(id, null)`. A deleted user's rows are normally removed by the cascade.
- A server down over a run catches up on the next tick; a period missed for a whole period is skipped (no backfill).
- Each `CreateAsync` is in its own try/catch: one failure does not block the others or the next user.
- Limit: check `Report.CountAsync(userId)` against `Report.MaxPerUser` (50) before generating; at the limit skip and notify in-app. Never delete reports.
- Single API instance is assumed, like the notification dispatcher (`backend/docs/Notifications.md`, Limits). Two instances could both read a due row and generate twice. Documented, not guarded (`shortcut:` comment; upgrade to a conditional `UPDATE ... WHERE NextRunAt = <old>` if the app is ever scaled out).
- Rows run one after another inside a tick; a busy tick is just longer. `shortcut:` comment, do not parallelize.
- Testability: the run method is `internal` and takes `nowUtc`, so tests call it directly. The advance-before-generate ordering cannot be observed with the EF InMemory provider the tests use; it is covered by code review.

**Notifications**
- `NotificationManager.EnqueueReportReadyAsync(user, report, sendEmail)`: in-app always, with `Link = "/reports?highlight=<report id>"`; email only when `sendEmail` and the user's email is confirmed and set (same rule as the import reminder), linking to `FrontendSettings.BaseUrl + Link`.
- `EnqueueReportLimitReachedAsync`: in-app only, link `/reports`.
- `EmailTemplates.ReportReadyTitle` and `ReportReady(userName, label, link)`.

**Frontend**
- Reports page: button, modal (period select, time input, "Also send email", time zone shown, saved from `Intl.DateTimeFormat`), schedules list. Reuse the patterns in `app/(app)/account/notifications/importReminder/` (time and time zone) and `reports/reportsTable/`.
- `NotificationItem` becomes clickable when `link` is set; the Reports table reads `?highlight=<id>`, scrolls the row into view and tints it with the primary color. Static, no animation, never red. An unknown id is ignored. The table paginates client-side (10 per page, newest first), so on `?highlight=<id>` the page is set from the row's index before scrolling.

**Security and ownership:** schedules are user-owned; the scheduler only generates for the row's own `UserId`; link values are path-only; tests cover another user reading, changing or deleting a schedule.

**Limits kept from #67:** UTC dates in report data; mixed-currency totals as in Analytics; max 50 reports per user.

## Bolts

| # | Bolt | Layer | Depends on |
|---|---|---|---|
| 1 | [bolt-1](bolt-1.md) | backend: schedules, scheduler, notification link | intent approved |
| 2 | [bolt-2](bolt-2.md) | ui: Schedule report button, modal, schedules list | bolt 1 |
| 3 | [bolt-3](bolt-3.md) | ui: notification link and row highlight | bolt 2 |
| 4 | [bolt-4](bolt-4.md) | ui: download from the notification (later, optional) | bolt 3 |

## Verify

1. `dotnet test`, `dotnet format --verify-no-changes`, build, frontend lint and build pass.
2. Browser (isolated DB, test user): create, edit and delete a monthly schedule from the Reports page; the list and the modal agree after reload; a second schedule for the same period edits the first.
3. Force `NextRunAt` to the past (SQL) with a short poll interval: a report for the previous month appears in the list, with an in-app notification.
4. Click the notification: the Reports page opens and the new row is highlighted, also when it is not on page 1; after deleting the report the notification still opens the page and highlights nothing.
5. Quarterly runs only on 1 Jan/Apr/Jul/Oct and yearly only on 1 Jan, in the user's time zone (unit tests, including a UTC+1 zone at 00:30 and a DST gap).
6. Email arrives in Mailpit only when "Also send email" is on and the address is confirmed; its link opens the highlighted row.
7. With 50 reports the run skips generation, notifies, deletes nothing.
8. 375 px: no horizontal scroll in the modal, the list or the table.

## Decisions

- 2026-11-17: fixed 02:00 UTC run and three checkboxes in the Notifications tab (first draft). **Superseded 2026-11-18** by the user-chosen time and the Reports page modal.
- 2026-11-18: one schedule per period (max 3); the user picks the time of day; the time zone is the browser's.
- 2026-11-18: scheduled reports are normal stored reports; no auto-delete. The 50-report skip and notice stay because reports accumulate (drop them if you prefer silent failure).
- 2026-11-18: the in-app notification gets a `Link` (migration) so it can open the Reports page and highlight the row. Highlight costs one nullable column plus click handling and a query-param highlight. Download from the notification reuses the same link but adds a type-specific button and a deleted-report state, so it is bolt 4. Email attachment is out of scope.
- 2026-11-18: saving a schedule whose next occurrence is later the same day runs then (replaces the "first run is the next period start" rule from the first draft).
- 2026-11-18: a Sonnet review against the code added: the link must travel through the outbox (extra column), `CreateAsync` needs a separate period date, `ReminderSchedule` must be generalized (and its scan limit raised), enum validation on the new routes, and pagination handling for the highlight.
- 2026-11-17: missed periods are skipped, not backfilled; single API instance assumed.
- 2026-11-17: this is the first intent run with the aidlc workflow; PR titles carry the `TEST AI-DLC:` prefix.
