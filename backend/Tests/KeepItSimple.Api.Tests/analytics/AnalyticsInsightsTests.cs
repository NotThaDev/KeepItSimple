using KeepItSimple.Api.Models;
using static KeepItSimple.Api.Models.Transaction;

namespace KeepItSimple.Api.Tests.analytics;

public class AnalyticsInsightsTests
{
    private static readonly DateTime Now = new(2026, 9, 18, 12, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void Spending_current_month_compares_against_last_month()
    {
        var insight = Analytics.ComputePeriodInsight(
            AnalyticsKind.Spending,
            AnalyticsTimeRange.CurrentMonth,
            SampleTransactions(),
            SamplePockets(),
            Now);

        Assert.Equal(150m, insight.CurrentTotal);
        Assert.Equal(80m, insight.PreviousTotal);
        Assert.Equal(70m, insight.ChangeAmount);
        Assert.Equal(87.5m, insight.ChangePercent);
        Assert.True(insight.HasComparison);
        Assert.Equal(AnalyticsGranularity.Day, insight.Granularity);
        Assert.Equal(TransactionCategory.Food, insight.TopCategory);
        Assert.Equal(
            [TransactionCategory.Food, TransactionCategory.Transport],
            insight.ByCategory.Select(entry => entry.Category));
        Assert.Equal(31, insight.Series.Count);
        Assert.Equal(100m, insight.Series.Single(point => point.Label == "10").Total);
        Assert.Equal(80m, insight.Series.Single(point => point.Label == "5").PreviousTotal);
    }

    [Fact]
    public void Spending_excludes_savings_and_investments()
    {
        var insight = Analytics.ComputePeriodInsight(
            AnalyticsKind.Spending,
            AnalyticsTimeRange.CurrentMonth,
            SampleTransactions(),
            SamplePockets(),
            Now);

        Assert.DoesNotContain(
            insight.ByCategory,
            entry => entry.Category is TransactionCategory.Savings or TransactionCategory.Investments);
    }

    [Fact]
    public void Income_current_month_excludes_positive_savings_transfers()
    {
        var insight = Analytics.ComputePeriodInsight(
            AnalyticsKind.Income,
            AnalyticsTimeRange.CurrentMonth,
            SampleTransactions(),
            SamplePockets(),
            Now);

        Assert.Equal(2035m, insight.CurrentTotal);
        Assert.Equal(1800m, insight.PreviousTotal);
        Assert.Equal(TransactionCategory.Salary, insight.TopCategory);
        Assert.DoesNotContain(
            insight.ByCategory,
            entry => entry.Category == TransactionCategory.Savings);
    }

    [Fact]
    public void Interest_includes_dividends()
    {
        var insight = Analytics.ComputePeriodInsight(
            AnalyticsKind.Interest,
            AnalyticsTimeRange.CurrentMonth,
            SampleTransactions(),
            SamplePockets(),
            Now);

        Assert.Equal(35m, insight.CurrentTotal);
        Assert.Equal(
            [TransactionCategory.Interest, TransactionCategory.Dividends],
            insight.ByCategory.Select(entry => entry.Category));
    }

    [Fact]
    public void Savings_and_investments_use_absolute_amounts()
    {
        var savings = Analytics.ComputePeriodInsight(
            AnalyticsKind.Savings,
            AnalyticsTimeRange.CurrentMonth,
            SampleTransactions(),
            SamplePockets(),
            Now);
        var investments = Analytics.ComputePeriodInsight(
            AnalyticsKind.Investments,
            AnalyticsTimeRange.CurrentMonth,
            SampleTransactions(),
            SamplePockets(),
            Now);

        Assert.Equal(300m, savings.CurrentTotal);
        Assert.Equal(200m, investments.CurrentTotal);
        Assert.Equal(100m, savings.ByPocket.Single(entry => entry.Pocket.Id == 1).Total);
        Assert.Equal(200m, savings.ByPocket.Single(entry => entry.Pocket.Id == 2).Total);
    }

    [Fact]
    public void Last_three_months_compare_against_the_previous_three()
    {
        var insight = Analytics.ComputePeriodInsight(
            AnalyticsKind.Spending,
            AnalyticsTimeRange.Last3Months,
            SampleTransactions(),
            SamplePockets(),
            Now);

        Assert.Equal(270m, insight.CurrentTotal);
        Assert.Equal(40m, insight.PreviousTotal);
        Assert.Equal(AnalyticsGranularity.Month, insight.Granularity);
        Assert.Equal(
            ["Jul 2026", "Aug 2026", "Sep 2026"],
            insight.Series.Select(point => point.Label));
        Assert.Equal(
            ["Apr 2026", "May 2026", "Jun 2026"],
            insight.Series.Select(point => point.ComparisonLabel));
        Assert.Equal(40m, insight.Series.Single(point => point.Label == "Jul 2026").Total);
        Assert.Equal(20m, insight.Series.Single(point => point.Label == "Sep 2026").PreviousTotal);
    }

    [Fact]
    public void All_time_has_no_comparison_and_starts_at_the_earliest_month()
    {
        var insight = Analytics.ComputePeriodInsight(
            AnalyticsKind.Spending,
            AnalyticsTimeRange.AllTime,
            SampleTransactions(),
            SamplePockets(),
            Now);

        Assert.False(insight.HasComparison);
        Assert.Null(insight.ComparisonFrom);
        Assert.Equal(new DateTime(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc), insight.From);
        Assert.Equal(310m, insight.CurrentTotal);
        Assert.Equal("Apr 2026", insight.Series[0].Label);
        Assert.Equal("Sep 2026", insight.Series[^1].Label);
        Assert.All(insight.Series, point => Assert.Null(point.ComparisonLabel));
    }

    [Fact]
    public void Last_month_uses_the_month_before_as_comparison()
    {
        var insight = Analytics.ComputePeriodInsight(
            AnalyticsKind.Income,
            AnalyticsTimeRange.LastMonth,
            SampleTransactions(),
            SamplePockets(),
            Now);

        Assert.Equal(1800m, insight.CurrentTotal);
        Assert.Equal(0m, insight.PreviousTotal);
        Assert.Null(insight.ChangePercent);
        Assert.Equal(new DateTime(2026, 8, 1, 0, 0, 0, DateTimeKind.Utc), insight.From);
        Assert.Equal(AnalyticsGranularity.Day, insight.Granularity);
    }

    private static List<Pocket> SamplePockets() =>
    [
        new Pocket { Id = 1, Name = "Checking", Currency = "EUR", Balance = 1200m },
        new Pocket { Id = 2, Name = "Savings", Currency = "EUR", Balance = 400m }
    ];

    private static List<Transaction> SampleTransactions() =>
    [
        Tx(1, -100m, new DateTime(2026, 9, 10, 8, 0, 0, DateTimeKind.Utc), TransactionCategory.Food),
        Tx(1, -50m, new DateTime(2026, 9, 12, 8, 0, 0, DateTimeKind.Utc), TransactionCategory.Transport),
        Tx(1, 2000m, new DateTime(2026, 9, 1, 8, 0, 0, DateTimeKind.Utc), TransactionCategory.Salary),
        Tx(1, 25m, new DateTime(2026, 9, 4, 8, 0, 0, DateTimeKind.Utc), TransactionCategory.Interest),
        Tx(1, 10m, new DateTime(2026, 9, 6, 8, 0, 0, DateTimeKind.Utc), TransactionCategory.Dividends),
        Tx(1, -100m, new DateTime(2026, 9, 8, 8, 0, 0, DateTimeKind.Utc), TransactionCategory.Savings),
        Tx(2, 200m, new DateTime(2026, 9, 8, 9, 0, 0, DateTimeKind.Utc), TransactionCategory.Savings),
        Tx(1, -200m, new DateTime(2026, 9, 15, 8, 0, 0, DateTimeKind.Utc), TransactionCategory.Investments),
        Tx(1, -80m, new DateTime(2026, 8, 5, 8, 0, 0, DateTimeKind.Utc), TransactionCategory.Food),
        Tx(1, 1800m, new DateTime(2026, 8, 1, 8, 0, 0, DateTimeKind.Utc), TransactionCategory.Salary),
        Tx(1, -40m, new DateTime(2026, 7, 20, 8, 0, 0, DateTimeKind.Utc), TransactionCategory.Food),
        Tx(1, -20m, new DateTime(2026, 6, 18, 8, 0, 0, DateTimeKind.Utc), TransactionCategory.Food),
        Tx(1, -20m, new DateTime(2026, 4, 2, 8, 0, 0, DateTimeKind.Utc), TransactionCategory.Food)
    ];

    private static Transaction Tx(
        int pocketId,
        decimal amount,
        DateTime date,
        TransactionCategory category) =>
        new()
        {
            PocketId = pocketId,
            Amount = amount,
            Date = date,
            Category = category,
            Description = category.ToString()
        };
}
