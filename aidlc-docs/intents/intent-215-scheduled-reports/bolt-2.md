# Bolt 2/4: Schedule report on the Reports page (#215)

- **Status:** planned
- **PR:** -
- **Branch:** `intent-215/bolt-2`
- **Base:** `intent-215/bolt-1`

## Goal

From the Reports page the user can schedule a report, and see, edit and delete their schedules.

## Done when

- A **Schedule report** button on the Reports page opens a modal: period (every month, every quarter, every year), time of day, "Also send email", the time zone shown. Save creates or edits (a period already scheduled is edited, not duplicated); loading, saving and error states are shown.
- A "Scheduled reports" list on the page shows each schedule (period, time, time zone, next run, email on or off) with Edit (opens the modal filled in) and Delete (confirmation).
- Empty state when there are no schedules.
- Lint and build pass; checked in the browser on desktop and 375 px; desktop and mobile screenshots attached to the PR.

## Work

- Design spec first (`design:design-system`): button placement, modal, list, states, accessibility, mobile. Neutral primary for emphasis, never red; no icon libraries beyond Lucide.
- Read for style: `frontend/app/(app)/reports/ReportsPageContent.tsx`, `reports/reportsTable/` (`ReportActions.tsx` shows the delete confirmation and download pattern), `frontend/app/(app)/account/notifications/importReminder/` (time and time zone handling, `browserTimeZone`), `frontend/lib/models/Report.ts`.
- API functions and types in `frontend/lib/models/` for the three schedule endpoints; follow the frontend skill (component folders, arrow handlers).
- Update the frontend docs if a doc for reports exists, otherwise `frontend/docs/Notifications.md` only if it mentions reports.
- Verify with an isolated DB and a test user; delete the test user afterwards.

## Out of scope

Backend changes, notification click and row highlight (bolt 3), download from the notification (bolt 4), a custom run day.

## Outcome

<Filled in the bolt PR.>

## Decisions

<Dated one-liners made while building.>
