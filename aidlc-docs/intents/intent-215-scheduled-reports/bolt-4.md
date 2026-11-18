# Bolt 4/4: Download the report from the notification (#215)

- **Status:** planned (later, optional: decide after bolt 3 ships)
- **PR:** -
- **Branch:** `intent-215/bolt-4`
- **Base:** `intent-215/bolt-3`

## Goal

The user can download a scheduled report straight from its notification, without opening the Reports page.

## Done when

- The "report ready" notification shows a **Download** action next to the link.
- Download calls the existing report download endpoint for the report id and saves the file; while downloading the button shows a busy state.
- If the report was deleted (404) the notification shows a short "report no longer available" state instead of a broken button.
- Lint and build pass; checked in the browser on desktop and 375 px; screenshots attached.

## Work

- Why this is a separate bolt: it reuses the link from bolt 1 but needs a type-specific action in the generic `NotificationItem`, an id taken from the notification (parse `highlight=<id>` from the link, or add a typed field in a small backend change), `downloadReport` working from an id instead of a `Report` object, and a deleted-report state.
- Decide the id source at the start of this bolt: parsing the link is the smallest change; a typed field means a backend change and a migration.
- Read: `frontend/components/notifications/NotificationItem.tsx`, `frontend/lib/models/Report.ts` (`downloadReport`), `reports/reportsTable/ReportActions.tsx`.

## Out of scope

Email attachment: the file would leave the authenticated area, and the notification outbox stores no blobs. If wanted later it needs its own design.

## Outcome

<Filled in the bolt PR.>

## Decisions

<Dated one-liners made while building.>
