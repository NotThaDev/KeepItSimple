# Excel reports

A user can generate an `.xlsx` report of the last complete month, quarter, or year, compared with the period before it. The maths is pure (`ReportCalculator`, no database) and the file is rendered by `ReportWorkbook` (EPPlus). Both are tested without a database.

## Periods

`ReportPeriodRange.Resolve(period, utcNow)` picks the previous complete calendar period and the one before it. End dates are exclusive.

| Period | Report covers | Compared with |
|--------|---------------|---------------|
| LastMonth | previous calendar month | the month before |
| LastQuarter | previous calendar quarter | the quarter before |
| LastYear | previous calendar year | the year before |

## Metrics

Rules are the same as Analytics (`Analytics.IsIncome` / `IsExpense`):

- **Expense**: amount below 0, category not Savings, Investments, Transfer, or Withdraw.
- **Income**: amount above 0, an income category, not Transfer or Withdraw.
- **Net**: income minus expenses.
- **Savings rate**: net / income, 0 when there is no income.
- **Saved / invested**: absolute value of outflows in Savings and Investments.
- **Average daily expense**: expenses / days in the period.
- **Balances**: closing = sum of current pocket balances minus every transaction dated on or after the period end; opening = closing minus every transaction in the period (all categories, transfers included). Because the starting point is the stored pocket balance, manual balance adjustments are part of the figures.
- **Categories**: share of total, count, average, previous-period amount, and delta. A category present only in the previous period shows with amount 0.
- **Top descriptions**: expenses grouped by trimmed, case-insensitive description, top 10.

The trend has one bucket per day for a month and one per month for a quarter or year.

## Sheets

Summary (KPIs with change vs previous, three charts), Trend, Expenses by category, Income by category, Top spending, one `Pocket - <name>` sheet per pocket, and Transactions (Excel table with totals row). Sheet names are cleaned of `[]:*?/\`, cut to 31 characters, and made unique. Charts read from cells on the same sheet. Empty periods show "No transactions in this period." instead of charts.

## Limits

- Dates are UTC; no timezone conversion.
- Mixed currencies are summed in the first pocket's currency (default EUR). There is no exchange rate conversion.
- Each user keeps up to 50 stored reports.
- EPPlus runs under its non-commercial personal license (`ExcelPackage.License.SetNonCommercialPersonal`).
