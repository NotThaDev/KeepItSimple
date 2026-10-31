# KeepItSimple – Frontend

The [KeepItSimple](../README.md) interface: where you look at money in, money out, and where it is going.

It is a Next.js app. It talks to the API and has these areas:

| | Page | Path | What it does |
| --- | --- | --- | --- |
| 📊 | Dashboard | `/dashboard` | Balance, spending by category, and the trend over time |
| 📈 | Analytics | `/analytics` | Income, expense, and saving views |
| 💸 | Transactions | `/transactions` | Movements, categories, filters, and file import |
| 🏷️ | Category rules | `/transactions/rules` | Rules that categorize movements imported from a bank account, with preview and apply |
| 👛 | Pockets | `/pockets` | Accounts, balances, and currencies |
| 👤 | Account | `/account` | Username, email, profile picture and active sessions of the signed-in user; opened from the user menu |
| ✉️ | Confirm email | `/confirm-email` | Confirms the email address from the link sent after registration |
| 🔑 | Forgot password | `/forgot-password` | Sends a link to reset the password; the reply is the same whether or not the email is registered |
| 🔑 | Reset password | `/reset-password` | Sets a new password from the emailed link; the link is single-use and works for one day |

Home (`/`) redirects to the dashboard.

This file is the overview. Notes for a complex screen live in `docs/`.

## Stack

- **Next.js** (App Router) and **React**
- **Tailwind CSS** and **shadcn/ui**
- **Recharts** for the charts
- **TanStack Table** for the lists

## Conventions

- Inside a component, write handlers as arrow functions: `const onSave = async () => { ... };`, not `async function onSave() { ... }`.
- Use `useCallback` only when something compares the function between renders: a `useEffect`/`useMemo` dependency array, a prop of a `React.memo` child, or a context value. Everywhere else it adds code and a deps array to keep right, and saves nothing: the function is still created on every render, and a plain child re-renders with its parent anyway.

## Run

From the `frontend` folder:

```bash
bun install
bun run dev
```

The app is at [http://localhost:3000](http://localhost:3000).

The API has to be running, and `API_BASE_URL` in `.env.local` has to point at it (in development, `http://localhost:5264`). The browser never calls the API directly: Next forwards `/api/*` to it (`next.config.ts`), and server components call it with the user's `kis_access` cookie. Login state lives in HttpOnly cookies; `proxy.ts` refreshes them.

How to start the API and the database is in the [backend README](../backend/README.md).
