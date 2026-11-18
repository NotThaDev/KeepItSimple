# Bolt 3/4: Open the new report from the notification (#215)

- **Status:** planned
- **PR:** -
- **Branch:** `intent-215/bolt-3`
- **Base:** `intent-215/bolt-2`

## Goal

Clicking the "report ready" notification opens the Reports page with the new report's row highlighted.

## Done when

- `NotificationItem` is clickable when the notification has a `link`: it navigates to the link and marks the notification read.
- The Reports page reads `?highlight=<id>`, scrolls that row into view and tints it with the theme's primary color. Static, no animation, never red. The highlight clears when the user leaves the page or highlights another row. An unknown or missing id highlights nothing and shows no error.
- The frontend notification type gains `link`; items without a link behave as before.
- Lint and build pass; checked in the browser (generate a report by forcing a due schedule, click the notification) on desktop and 375 px; screenshots attached.

## Work

- Read for style: `frontend/components/notifications/NotificationItem.tsx`, `NotificationsDrawer.tsx`, `utils.ts`, `frontend/stores/notifications/`, `frontend/lib/models/Notification.ts` (confirm these exist before starting), `reports/reportsTable/ReportColumns.tsx`, `ReportsPageContent.tsx`.
- The table (`components/common/dataTable/DataTable.tsx`) paginates client-side, 10 per page, newest first. On `?highlight=<id>` set the page index from the row's index in the reports array (or the table's initial pagination state) before scrolling; check that `ReportColumns.tsx` rows can take an id or class. `NotificationItem.tsx` is a plain `<li>` today, and `NotificationsDrawer.tsx` already uses `next/link`.
- Keep links in-app: use the router for path links, never a plain external navigation.
- Design spec for the highlight tint (contrast in light and dark mode).

## Out of scope

Download from the notification (bolt 4), email attachment, animations.

## Outcome

<Filled in the bolt PR.>

## Decisions

<Dated one-liners made while building.>
