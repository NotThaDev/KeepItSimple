using KeepItSimple.Api.Helpers;

namespace KeepItSimple.Api.Models.Reports;

public record ReportData(
    ReportPeriodRange Range,
    DateTime GeneratedAt,
    string Currency,
    ReportScope Total,
    List<ReportScope> Pockets,
    List<ReportTransactionRow> Transactions);
