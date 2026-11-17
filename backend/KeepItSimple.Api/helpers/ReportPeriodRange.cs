using KeepItSimple.Api.Models.Reports;

namespace KeepItSimple.Api.Helpers;

/// <summary>
/// The previous complete calendar period and the one before it, in UTC. End dates are exclusive.
/// </summary>
public readonly record struct ReportPeriodRange(
    ReportPeriod Period,
    DateTime Start,
    DateTime End,
    DateTime PreviousStart,
    DateTime PreviousEnd,
    string Label,
    string PreviousLabel)
{
    public static ReportPeriodRange Resolve(ReportPeriod period, DateTime utcNow)
    {
        var thisMonth = new DateTime(utcNow.Year, utcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        return period switch
        {
            ReportPeriod.LastMonth => FromStart(period, thisMonth.AddMonths(-1), 1),
            ReportPeriod.LastQuarter => FromStart(period, thisMonth.AddMonths(-((utcNow.Month - 1) % 3)).AddMonths(-3), 3),
            ReportPeriod.LastYear => FromStart(period, new DateTime(utcNow.Year - 1, 1, 1, 0, 0, 0, DateTimeKind.Utc), 12),
            _ => throw new ArgumentException($"Unknown report period: {period}"),
        };
    }

    private static ReportPeriodRange FromStart(ReportPeriod period, DateTime start, int months)
    {
        var previousStart = start.AddMonths(-months);
        return new ReportPeriodRange(period, start, start.AddMonths(months), previousStart, start, LabelFor(period, start), LabelFor(period, previousStart));
    }

    private static string LabelFor(ReportPeriod period, DateTime start) => period switch
    {
        ReportPeriod.LastMonth => start.ToString("MMMM yyyy", System.Globalization.CultureInfo.InvariantCulture),
        ReportPeriod.LastQuarter => $"Q{(start.Month - 1) / 3 + 1} {start.Year}",
        _ => start.Year.ToString(System.Globalization.CultureInfo.InvariantCulture),
    };
}
