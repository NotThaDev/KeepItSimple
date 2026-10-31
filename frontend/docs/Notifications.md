# Notifications drawer

In-app notifications, shown from the user menu (**Notifications**) and as a badge on the avatar.

- **Polling**: `stores/notifications` calls `GET /api/notifications/unread-summary` every 30 s. It skips a tick while the tab is hidden and polls once when the tab becomes visible again.
- **Badges**: the summary `count` feeds the avatar badge and the menu badge (`99+` above 99). Zero hides both.
- **New-notification toast**: the summary `latestId` is compared with the previous poll. A higher id (or the first id after none) shows a toast with the newest title (bottom-right; top-center on phones, where the bottom nav sits). The first poll after page load never toasts, so existing notifications stay quiet.
- **Drawer**: opening it loads the "To read" tab. "Read" loads the read list on demand. Tabs are `unread` / `read` from the API `read` flag.
- **Mark as read**: optimistic. The item leaves "To read" and the count drops at once; a failed call restores both and shows an error toast.
- **Retention**: the server keeps notifications for 30 days, so "Read" is bounded.
- **Errors**: a failed poll is silent (no toast spam). A failed list load or mark-as-read shows a toast.

Code: `frontend/stores/notifications/` (state and polling), `frontend/components/notifications/` (drawer, items, badge, toast). Model: `frontend/lib/models/Notification.ts`.
