namespace KeepItSimple.Api.Models.Reports;

public record ReportKpis(
    decimal Income,
    decimal Expenses,
    decimal Net,
    decimal SavingsRate,
    decimal SavedInvested,
    decimal AverageDailyExpense,
    int TransactionCount,
    ReportTransactionRow? LargestExpense,
    decimal OpeningBalance,
    decimal ClosingBalance);
