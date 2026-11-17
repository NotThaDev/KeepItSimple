namespace KeepItSimple.Api.Models.Reports;

public record ReportKpis(
    decimal Income,
    decimal Expenses,
    decimal Net,
    decimal SavingsRate,
    decimal Saved,
    decimal Invested,
    decimal AverageDailyExpense,
    int TransactionCount,
    ReportTransactionRow? LargestExpense,
    decimal OpeningBalance,
    decimal ClosingBalance);
