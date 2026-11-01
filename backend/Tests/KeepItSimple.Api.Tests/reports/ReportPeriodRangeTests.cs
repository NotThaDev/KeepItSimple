using KeepItSimple.Api.Helpers;
using KeepItSimple.Api.Models.Reports;

namespace KeepItSimple.Api.Tests.Reports;

public class ReportPeriodRangeTests
{
    [Fact]
    public void Resolve_LastMonth_in_january_returns_december()
    {
        var range = ReportPeriodRange.Resolve(ReportPeriod.LastMonth, new DateTime(2026, 1, 15, 0, 0, 0, DateTimeKind.Utc));

        Assert.Equal(new DateTime(2025, 12, 1, 0, 0, 0, DateTimeKind.Utc), range.Start);
        Assert.Equal(new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc), range.End);
        Assert.Equal(new DateTime(2025, 11, 1, 0, 0, 0, DateTimeKind.Utc), range.PreviousStart);
        Assert.Equal("December 2025", range.Label);
    }

    [Fact]
    public void Resolve_LastQuarter_in_february_returns_Q4_of_previous_year()
    {
        var range = ReportPeriodRange.Resolve(ReportPeriod.LastQuarter, new DateTime(2026, 2, 10, 0, 0, 0, DateTimeKind.Utc));

        Assert.Equal(new DateTime(2025, 10, 1, 0, 0, 0, DateTimeKind.Utc), range.Start);
        Assert.Equal(new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc), range.End);
        Assert.Equal(new DateTime(2025, 7, 1, 0, 0, 0, DateTimeKind.Utc), range.PreviousStart);
        Assert.Equal("Q4 2025", range.Label);
        Assert.Equal("Q3 2025", range.PreviousLabel);
    }

    [Fact]
    public void Resolve_LastQuarter_in_november_returns_Q3_of_same_year()
    {
        var range = ReportPeriodRange.Resolve(ReportPeriod.LastQuarter, new DateTime(2026, 11, 1, 0, 0, 0, DateTimeKind.Utc));

        Assert.Equal(new DateTime(2026, 7, 1, 0, 0, 0, DateTimeKind.Utc), range.Start);
        Assert.Equal("Q3 2026", range.Label);
    }

    [Fact]
    public void Resolve_LastYear_in_november_returns_previous_calendar_year()
    {
        var range = ReportPeriodRange.Resolve(ReportPeriod.LastYear, new DateTime(2026, 11, 1, 0, 0, 0, DateTimeKind.Utc));

        Assert.Equal(new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc), range.Start);
        Assert.Equal(new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc), range.End);
        Assert.Equal(new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc), range.PreviousStart);
        Assert.Equal("2025", range.Label);
    }
}
