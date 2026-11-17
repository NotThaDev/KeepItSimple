# Bolt 2/2: Scheduled reports settings UI (#215)

- **Status:** planned
- **PR:** -
- **Branch:** `intent-215/bolt-2`
- **Base:** `intent-215/bolt-1`

## Goal

The user can turn the report schedule on and off from the Notifications settings tab and finds it from an empty Reports page.

## Done when

- A "Scheduled reports" card in the Notifications tab: checkboxes Monthly, Quarterly, Yearly, a "Also send email" toggle, helper text "Generated on the 1st of each period at 02:00 UTC". It loads and saves through the bolt 1 endpoints and shows saving and error states.
- The Reports page empty state has a hint linking to the setting.
- Lint and build pass; checked in the browser on desktop and 375 px; screenshots attached to the PR.

## Work

- Design spec first (`design:design-system`): spacing, hierarchy, states, accessibility, mobile. Neutral primary for emphasis, never red.
- Read for style: `frontend/app/(app)/account/notifications/` (`NotificationsPageContent.tsx`, `importReminder/ImportReminderCard.tsx`, `utils.ts`), `frontend/app/(app)/reports/ReportsPageContent.tsx` (empty state: `EmptyStateCard`, `EMPTY_DESCRIPTION`). Confirm `frontend/lib/models/Notification.ts` and `frontend/stores/notifications/` exist before starting (not yet checked).
- New card as a sibling folder `reportSchedule/` next to `importReminder/`.
- API functions and types in `frontend/lib/models/`; follow the frontend skill (component folders, arrow handlers, no icon libraries beyond Lucide).
- Update `frontend/docs/Notifications.md`.
- Verify with an isolated DB and a test user; delete the test user afterwards.

## Out of scope

Backend changes, run-time picker, retention, a clickable link in the in-app notification.

## Outcome

<Filled in the bolt PR.>

## Decisions

<Dated one-liners made while building.>
