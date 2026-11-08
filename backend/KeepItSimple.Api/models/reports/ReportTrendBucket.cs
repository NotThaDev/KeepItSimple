namespace KeepItSimple.Api.Models.Reports;

public record ReportTrendBucket(
    string Label,
    DateTime Start,
    decimal Income,
    decimal Expenses,
    /// <summary>Net of every move that is neither income nor expense, so opening + income − expenses + transfers = closing.</summary>
    decimal Transfers,
    IReadOnlyList<string> TransferNotes,
    decimal Net,
    decimal CumulativeNet,
    decimal ClosingBalance);
