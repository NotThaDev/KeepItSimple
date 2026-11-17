namespace KeepItSimple.Api.Models.Reports;

public record ReportTransactionRow(
    DateTime Date,
    string Pocket,
    string Description,
    string Category,
    decimal Amount,
    string Type);
