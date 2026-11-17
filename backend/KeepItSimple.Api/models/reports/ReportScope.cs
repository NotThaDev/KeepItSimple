namespace KeepItSimple.Api.Models.Reports;

public record ReportScope(
    string Name,
    string Currency,
    ReportKpis Current,
    ReportKpis Previous,
    List<ReportTrendBucket> Trend,
    List<ReportCategoryRow> ExpensesByCategory,
    List<ReportCategoryRow> IncomeByCategory,
    List<ReportTransactionRow> TopExpenses,
    List<ReportDescriptionRow> TopDescriptions);
