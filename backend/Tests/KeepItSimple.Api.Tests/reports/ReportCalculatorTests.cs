using KeepItSimple.Api.Helpers;
using KeepItSimple.Api.Models;
using KeepItSimple.Api.Models.Reports;
using static KeepItSimple.Api.Models.Transaction;

namespace KeepItSimple.Api.Tests.Reports;

public class ReportCalculatorTests
{
    private static readonly DateTime Now = new(2026, 9, 20, 12, 0, 0, DateTimeKind.Utc);
    private static readonly ReportPeriodRange Month = ReportPeriodRange.Resolve(ReportPeriod.LastMonth, Now); // Aug 2026, prev Jul 2026

    private static DateTime D(int month, int day) => new(2026, month, day, 10, 0, 0, DateTimeKind.Utc);

    private static Transaction Tx(int pocketId, TransactionCategory category, decimal amount, DateTime date, string? description = null) =>
        new() { PocketId = pocketId, Category = category, Amount = amount, Date = date, Description = description };

    private static Pocket P(int id, string name, decimal balance, string currency = "EUR") =>
        new() { Id = id, Name = name, Balance = balance, Currency = currency };

    private static ReportData Run(List<Transaction> txs, params Pocket[] pockets) =>
        ReportCalculator.Calculate(txs, pockets, Month, Now);

    [Fact]
    public void Calculate_counts_savings_tagged_on_either_or_both_sides_once()
    {
        var receivingOnly = Run(
        [
            Tx(1, TransactionCategory.Transfer, -400, D(8, 30)),
            Tx(2, TransactionCategory.Savings, 400, D(8, 31)),
            Tx(2, TransactionCategory.Investments, -150, D(8, 17)),
        ], P(1, "Main", 1000), P(2, "Savings", 1000));
        var bothSides = Run(
        [
            Tx(1, TransactionCategory.Savings, -400, D(8, 30)),
            Tx(2, TransactionCategory.Savings, 400, D(8, 31)),
        ], P(1, "Main", 1000), P(2, "Savings", 1000));

        Assert.Equal(400m, receivingOnly.Total.Current.Saved);
        Assert.Equal(150m, receivingOnly.Total.Current.Invested);
        Assert.Equal(400m, bothSides.Total.Current.Saved);
    }

    [Fact]
    public void Calculate_moves_and_savings_are_not_income_or_expenses()
    {
        var data = Run(
        [
            Tx(1, TransactionCategory.Salary, 2000, D(8, 5)),
            Tx(1, TransactionCategory.Food, -100, D(8, 6)),
            Tx(1, TransactionCategory.Transfer, -300, D(8, 7)),
            Tx(1, TransactionCategory.Withdraw, -50, D(8, 8)),
            Tx(1, TransactionCategory.Savings, -200, D(8, 9)),
            Tx(1, TransactionCategory.Investments, -150, D(8, 10)),
        ], P(1, "Main", 1000));

        Assert.Equal(2000m, data.Total.Current.Income);
        Assert.Equal(100m, data.Total.Current.Expenses);
        Assert.Equal(200m, data.Total.Current.Saved);
        Assert.Equal(150m, data.Total.Current.Invested);
        Assert.Equal(6, data.Total.Current.TransactionCount);
        Assert.Contains(data.Transactions, t => t.Type == "Transfer");
        Assert.Contains(data.Transactions, t => t.Type == "Savings");
    }

    [Fact]
    public void Calculate_no_income_gives_zero_savings_rate()
    {
        var data = Run([Tx(1, TransactionCategory.Food, -40, D(8, 6))], P(1, "Main", 100));

        Assert.Equal(0m, data.Total.Current.SavingsRate);
        Assert.Equal(-40m, data.Total.Current.Net);
    }

    [Fact]
    public void Calculate_balances_exclude_transactions_after_period_end()
    {
        var data = Run(
        [
            Tx(1, TransactionCategory.Salary, 1000, D(8, 5)),
            Tx(1, TransactionCategory.Food, -100, D(8, 6)),
            Tx(1, TransactionCategory.Food, -30, D(9, 2)),
            Tx(1, TransactionCategory.Transfer, -20, D(7, 2)),
        ], P(1, "Main", 2000));

        Assert.Equal(2030m, data.Total.Current.ClosingBalance);
        Assert.Equal(1130m, data.Total.Current.OpeningBalance);
        Assert.Equal(1130m, data.Total.Previous.ClosingBalance);
        Assert.Equal(1150m, data.Total.Previous.OpeningBalance);
    }

    [Fact]
    public void Calculate_category_share_delta_and_previous_only_category()
    {
        var data = Run(
        [
            Tx(1, TransactionCategory.Food, -60, D(8, 5)),
            Tx(1, TransactionCategory.Food, -20, D(8, 6)),
            Tx(1, TransactionCategory.Transport, -20, D(8, 7)),
            Tx(1, TransactionCategory.Food, -50, D(7, 5)),
            Tx(1, TransactionCategory.Travel, -70, D(7, 6)),
        ], P(1, "Main", 0));

        var food = data.Total.ExpensesByCategory.Single(r => r.Category == "Food");
        Assert.Equal(80m, food.Amount);
        Assert.Equal(0.8m, food.Share);
        Assert.Equal(2, food.Count);
        Assert.Equal(40m, food.Average);
        Assert.Equal(50m, food.PreviousAmount);
        Assert.Equal(30m, food.Delta);

        var travel = data.Total.ExpensesByCategory.Single(r => r.Category == "Travel");
        Assert.Equal(0m, travel.Amount);
        Assert.Equal(-70m, travel.Delta);
        Assert.Equal("Food", data.Total.ExpensesByCategory[0].Category);
    }

    [Fact]
    public void Calculate_top_descriptions_group_case_insensitively()
    {
        var data = Run(
        [
            Tx(1, TransactionCategory.Food, -10, D(8, 5), "Coop"),
            Tx(1, TransactionCategory.Food, -15, D(8, 6), "  coop "),
            Tx(1, TransactionCategory.Food, -5, D(8, 7), null),
        ], P(1, "Main", 0));

        var top = data.Total.TopDescriptions;
        Assert.Equal(2, top.Count);
        Assert.Equal(25m, top[0].Total);
        Assert.Equal(2, top[0].Count);
        Assert.Equal("(no description)", top[1].Description);
    }

    [Fact]
    public void Calculate_splits_per_pocket_ordered_by_name()
    {
        var data = Run(
        [
            Tx(1, TransactionCategory.Food, -10, D(8, 5)),
            Tx(2, TransactionCategory.Food, -30, D(8, 5)),
        ], P(1, "Zeta", 100), P(2, "Alpha", 200, "USD"));

        Assert.Equal(["Alpha", "Zeta"], data.Pockets.Select(p => p.Name));
        Assert.Equal(30m, data.Pockets[0].Current.Expenses);
        Assert.Equal("USD", data.Pockets[0].Currency);
        Assert.Equal(10m, data.Pockets[1].Current.Expenses);
        Assert.Equal(40m, data.Total.Current.Expenses);
        Assert.Equal("EUR", data.Currency);
    }

    [Fact]
    public void Calculate_ignores_transactions_outside_range()
    {
        var data = Run(
        [
            Tx(1, TransactionCategory.Food, -10, D(8, 5)),
            Tx(1, TransactionCategory.Food, -99, D(6, 5)),
            Tx(1, TransactionCategory.Food, -99, new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc)),
        ], P(1, "Main", 0));

        Assert.Single(data.Transactions);
        Assert.Equal(10m, data.Total.Current.Expenses);
        Assert.Equal(0m, data.Total.Previous.Expenses);
    }

    [Fact]
    public void Calculate_month_has_daily_buckets_and_year_has_twelve()
    {
        var month = Run([], P(1, "Main", 0));
        Assert.Equal(31, month.Total.Trend.Count);
        Assert.Equal("01 Aug", month.Total.Trend[0].Label);

        var year = ReportCalculator.Calculate([], [P(1, "Main", 0)], ReportPeriodRange.Resolve(ReportPeriod.LastYear, Now), Now);
        Assert.Equal(12, year.Total.Trend.Count);
        Assert.Equal("Jan 2025", year.Total.Trend[0].Label);
    }

    [Fact]
    public void Calculate_trend_closing_balance_accumulates_from_opening()
    {
        var data = Run(
        [
            Tx(1, TransactionCategory.Salary, 100, D(8, 1)),
            Tx(1, TransactionCategory.Food, -40, D(8, 3)),
        ], P(1, "Main", 500));

        var trend = data.Total.Trend;
        Assert.Equal(440m, data.Total.Current.OpeningBalance);
        Assert.Equal(540m, trend[0].ClosingBalance);
        Assert.Equal(500m, trend[^1].ClosingBalance);
        Assert.Equal(60m, trend[^1].CumulativeNet);
    }
}
