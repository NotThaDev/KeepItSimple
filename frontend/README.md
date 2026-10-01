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

Home (`/`) redirects to the dashboard.

## Stack

- **Next.js** (App Router) and **React**
- **Tailwind CSS** and **shadcn/ui**
- **Recharts** for the charts
- **TanStack Table** for the lists

## Run

From the `frontend` folder:

```bash
bun install
bun run dev
```

The app is at [http://localhost:3000](http://localhost:3000).

The API has to be running, and `NEXT_PUBLIC_API_BASE_URL` has to point at it (in development, `http://localhost:5264`). Without that, requests never reach the data.

How to start the API and the database is in the [backend README](../backend/README.md).
