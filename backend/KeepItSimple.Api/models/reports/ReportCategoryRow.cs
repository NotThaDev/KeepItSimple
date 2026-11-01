namespace KeepItSimple.Api.Models.Reports;

public record ReportCategoryRow(
    string Category,
    decimal Amount,
    decimal Share,
    int Count,
    decimal Average,
    decimal PreviousAmount,
    decimal Delta);
