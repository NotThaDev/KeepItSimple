# KeepItSimple

A fast way to track personal finances in one place, without a pile of Excel files.

Money in, money out, and a clear picture of where it goes. The goal is a single app you can update in seconds and read at a glance: where spending happens, how often, and what is worth changing.

## What you can do

- **See cash flow.** Record what came in and what went out, and check the balance right away.
- **Understand spending.** Analytics for income, expenses, and savings, so patterns and frequency are easy to spot.
- **Categorize on import.** Rules are what make a bank export practical: they match a description, amount, pocket, or category, so new movements get the right category without tagging every row.
- **Know what to improve.** A quick read of the numbers, instead of rebuilding them across scattered spreadsheets.

## In the app

| | Area | What it shows |
| --- | --- | --- |
| 📊 | **Dashboard** | Total balance, comparison with last month, spending by category, and how expenses move over time. |
| 📈 | **Analytics** | Three views. **Income**: monthly cash flow, a 12-month trend, and active vs passive. **Expenses**: pace against last month, daily burn, a month projection, fixed vs variable, and how far income covers spending. **Savings**: leftover after expenses, what was put aside, and the savings rate. |
| 💸 | **Transactions** | Income and expenses, with categories and filters. Bank exports (Excel or CSV) can be imported instead of typed in by hand. Transfers between pockets count as movements, so they stay out of spending. |
| 🏷️ | **Category rules** | A core part of adding movements from a bank account. After an import, rules set the category from the description, amount, pocket, or current category, so the same shop or transfer does not have to be labeled by hand each time. You can reorder them, preview the matches, and apply them to a date range. |
| 👛 | **Pockets** | The accounts the money sits in, each with its own balance and currency. |

## Stack

<p>
  <img alt="React" src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img alt="C#" src="https://img.shields.io/badge/C%23-512BD4?style=for-the-badge&logo=csharp&logoColor=white" />
  <img alt="Docker" src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
  <img alt="Process Compose" src="https://img.shields.io/badge/Process%20Compose-111827?style=for-the-badge" />
</p>

| | | |
| --- | --- | --- |
| <img src="https://cdn.simpleicons.org/react/61DAFB" width="28" height="28" alt="React" /> | **React** | The interface. A Next.js app for the dashboard, transactions, and pockets. |
| <img src="https://cdn.simpleicons.org/dotnet/512BD4" width="28" height="28" alt="C#" /> | **C#** | The API. ASP.NET Core on .NET 10: pockets, transactions, analytics, category rules, and file import, with Entity Framework Core and PostgreSQL. |
| <img src="https://cdn.simpleicons.org/docker/2496ED" width="28" height="28" alt="Docker" /> | **Docker** | Local PostgreSQL (and pgAdmin) via Docker Compose at the repo root. |
| ⚙️ | **Process Compose** | Starts the whole local stack together from `process-compose.yml`: Docker, the C# API (`dotnet watch`), and the React dev server. |

## Documentation

- [Frontend](./frontend/README.md) — UI, pages, and how to run it locally.
- [Backend](./backend/README.md) — API, data model, transaction import, and tests.
