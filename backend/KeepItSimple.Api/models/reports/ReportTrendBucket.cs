namespace KeepItSimple.Api.Models.Reports;

public record ReportTrendBucket(
    string Label,
    DateTime Start,
    decimal Income,
    decimal Expenses,
    decimal Net,
    decimal CumulativeNet,
    decimal ClosingBalance);
