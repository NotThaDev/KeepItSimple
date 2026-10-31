<div align="center">

<img src="frontend/public/logo.png" alt="KeepItSimple logo" width="96" height="96" />

# KeepItSimple

**Personal finances in one place, without a pile of Excel files.**
Money in, money out, and a clear picture of where it goes.

[![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-20232A?logo=react&logoColor=61DAFB)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![Bun](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white)](https://bun.sh/)

[Features](#-features) · [In the App](#-in-the-app) · [Getting Started](#getting-started) · [Project Structure](#project-structure)

</div>

---

The goal is a single app you can update in seconds and read at a glance: where spending happens, how often, and what is worth changing.

## ✨ Features

| | Feature | Description |
|---|---------|-------------|
| 💰 | **See cash flow** | Record what came in and what went out, and check the balance right away |
| 🔍 | **Understand spending** | Analytics for income, expenses, and savings, so patterns and frequency are easy to spot |
| 🏷️ | **Categorize on import** | Rules match a description, amount, pocket, or category, so new movements get the right category without tagging every row |
| 🎯 | **Know what to improve** | A quick read of the numbers, instead of rebuilding them across scattered spreadsheets |

## 🧭 In the App

| | Area | What it shows |
|---|------|---------------|
| 📊 | **Dashboard** | Total balance, comparison with last month, spending by category, and how expenses move over time. |
| 📈 | **Analytics** | Three views. **Income**: monthly cash flow, a 12-month trend, and active vs passive. **Expenses**: pace against last month, daily burn, a month projection, fixed vs variable, and how far income covers spending. **Savings**: leftover after expenses, what was put aside, and the savings rate. |
| 💸 | **Transactions** | Income and expenses, with categories and filters. Bank exports (Excel or CSV) can be imported instead of typed in by hand. Transfers between pockets count as movements, so they stay out of spending. |
| 🏷️ | **Category rules** | After an import, rules set the category from the description, amount, pocket, or current category, so the same shop or transfer does not have to be labeled by hand each time. You can reorder them, preview the matches, and apply them to a date range. |
| 👛 | **Pockets** | The accounts the money sits in, each with its own balance and currency. |
| 👤 | **Account** | Your username, email and profile picture, and the devices you are logged in on (log any of them out). Opened from the user menu. |

## Tech Stack

- **Backend**: ASP.NET Core 10 Web API + Entity Framework Core
- **Frontend**: Next.js 16 (React 19) with Tailwind CSS 4
- **Database**: PostgreSQL (containerized, with pgAdmin)
- **Package Manager**: bun for frontend, dotnet CLI for backend
- **Orchestration**: process-compose starts the whole local stack

## Prerequisites

- **Bun** (frontend dev server and packages)
- **.NET SDK** 10.0
- **Docker** & Docker Compose
- **process-compose** ([installation guide](https://github.com/F1bonacc1/process-compose))

## Getting Started

### Quick Start (Recommended)

Start all services with a single command:

```bash
process-compose up
```

This will:

1. Create `.env` from `.env.example` if missing, then start Docker (PostgreSQL + pgAdmin)
2. Start the backend API (http://localhost:5264)
3. Start the frontend dev server (http://localhost:3000)

### Individual Services

**Backend only:**

```bash
cd backend/KeepItSimple.Api
dotnet watch
```

**Frontend only:**

```bash
cd frontend
bun install
bun run dev
```

**Database only:**

```bash
docker compose --env-file .env up -d
```

pgAdmin is available at http://localhost:5050 (credentials from `.env`).

## Project Structure

```
KeepItSimple/
├── backend/
│   ├── KeepItSimple.Api/
│   │   ├── controllers/     # API endpoints
│   │   ├── models/          # Domain entities (active record)
│   │   ├── dtos/            # Data transfer objects
│   │   ├── helpers/         # DbContext, import, matching, auth setup
│   │   └── Migrations/      # EF Core migrations
│   └── Tests/               # xUnit tests
├── frontend/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # UI components
│   ├── lib/                 # API models and actions
│   └── stores/              # Client state
├── docker-compose.yml       # PostgreSQL + pgAdmin
└── process-compose.yml      # Local stack orchestration
```

## Documentation

- [Frontend](./frontend/README.md) — UI, pages, and how to run it locally.
- [Backend](./backend/README.md) — API, data model, transaction import, and tests.
