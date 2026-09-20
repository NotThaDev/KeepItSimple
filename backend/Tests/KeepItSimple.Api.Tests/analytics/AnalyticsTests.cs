using KeepItSimple.Api.Models;
using KeepItSimple.Api.Models.Analytics;
using static KeepItSimple.Api.Models.Analytics.Analytics;
using static KeepItSimple.Api.Models.Transaction;

namespace KeepItSimple.Api.Tests.Analytics;

public class AnalyticsTests
{
    private static readonly DateTime Now = new(2026, 9, 20, 12, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void Overview_does_not_count_transfers_as_income_or_expense()
    {
        var pockets = TwoPockets(checkingBalance: 900, savingsBalance: 1100);
        var transactions = new List<Transaction>
        {
            Income(1, 1, TransactionCategory.Salary, 2000, 20),
            Expense(2, 1, TransactionCategory.Food, 80, 20),
            TransferOut(3, 1, 200, 20),
            TransferIn(4, 2, 200, 20),
        };

        var overview = BuildOverview(transactions, pockets, Now);

        Assert.Equal(-80m, overview.MonthlyTotalExpenses);
        Assert.Equal(2000m, overview.MonthlyTotalIncome);
        Assert.Equal(-80m, overview.TotalExpenses);
        Assert.Equal(2000m, overview.TotalIncome);
        Assert.Equal(TransactionCategory.Food, overview.TopExpenseCategory);
        Assert.DoesNotContain(
            overview.MonthlyExpensesByCategory,
            entry => entry.Category is TransactionCategory.Transfer);
        Assert.Equal(0m, overview.ExpensesPerPocket.Single(entry => entry.Pocket.Id == 2).Total);
        Assert.Equal(-80m, overview.ExpensesPerPocket.Single(entry => entry.Pocket.Id == 1).Total);
        Assert.Equal(-80m, overview.MonthlyExpensesDailyComparison.Single(entry => entry.Day == 20).ThisMonth);
    }

    [Fact]
    public void Overview_does_not_count_withdrawals_as_expenses()
    {
        var overview = BuildOverview(
            [
                Expense(1, 1, TransactionCategory.Food, 40, 18),
                Withdraw(2, 1, 120, 18),
            ],
            [PocketAt(1, 840)],
            Now);

        Assert.Equal(-40m, overview.MonthlyTotalExpenses);
        Assert.DoesNotContain(
            overview.MonthlyExpensesByCategory,
            entry => entry.Category is TransactionCategory.Withdraw);
        Assert.Equal(0m, overview.MonthlyTotalIncome);
    }

    [Fact]
    public void Overview_daily_comparison_ignores_transfer_legs()
    {
        var overview = BuildOverview(
            [
                Expense(1, 1, TransactionCategory.Transport, 15, 10),
                TransferOut(2, 1, 300, 10),
                TransferIn(3, 2, 300, 10),
            ],
            TwoPockets(700, 300),
            Now);

        Assert.Equal(-15m, overview.MonthlyExpensesDailyComparison.Single(entry => entry.Day == 10).ThisMonth);
    }

    [Fact]
    public void Expense_analytics_ignore_transfers_and_withdrawals()
    {
        var analytics = BuildExpenseAnalytics(
            [
                Income(1, 1, TransactionCategory.Salary, 1000, 5),
                Expense(2, 1, TransactionCategory.Groceries, 60, 12),
                Expense(3, 1, TransactionCategory.Rent, 400, 1),
                TransferOut(4, 1, 250, 12),
                TransferIn(5, 2, 250, 12),
                Withdraw(6, 1, 90, 12),
            ],
            TwoPockets(200, 250),
            Now);

        Assert.Equal(460m, analytics.TotalMonthlyExpenses);
        Assert.Equal(1000m, analytics.MonthlyIncome);
        Assert.Equal(0.46m, analytics.SpendingRate);
        Assert.Equal(-400m, analytics.FixedExpenses);
        Assert.Equal(60m, analytics.ExpensePerDay[12]);
        Assert.DoesNotContain(
            analytics.ExpenseByCategory,
            entry => entry.Category is TransactionCategory.Transfer or TransactionCategory.Withdraw);
        Assert.Equal(460m, analytics.ExpensePerPocket.Single(entry => entry.Pocket.Id == 1).Total);
        Assert.Equal(0m, analytics.ExpensePerPocket.Single(entry => entry.Pocket.Id == 2).Total);
        Assert.DoesNotContain(
            analytics.TopExpenses,
            transaction => transaction.Category is TransactionCategory.Transfer or TransactionCategory.Withdraw);
        Assert.Equal(460m, analytics.MonthlySpendingPace.Single(entry => entry.Day == 20).ThisMonth);
        Assert.Equal(460m, analytics.MonthlySpendComparison.Single(entry => entry.Month == 9).ThisYear);
    }

    [Fact]
    public void Income_analytics_ignore_transfer_inflows_and_do_not_treat_them_as_expenses()
    {
        var analytics = BuildIncomeAnalytics(
            [
                Income(1, 1, TransactionCategory.Salary, 1800, 1),
                Expense(2, 1, TransactionCategory.Food, 100, 8),
                TransferOut(3, 1, 500, 8),
                TransferIn(4, 2, 500, 8),
                Withdraw(5, 1, 70, 8),
            ],
            TwoPockets(1130, 500),
            Now);

        Assert.Equal(1800m, analytics.TotalMonthlyIncome);
        Assert.Equal(100m, analytics.MonthlyExpenses);
        Assert.Equal(1700m, analytics.NetMonthlyIncome);
        Assert.Equal(1700m / 1800m, analytics.SavingsRate);
        Assert.Equal(1800m, analytics.MonthlyActiveIncome);
        Assert.DoesNotContain(
            analytics.MonthlyIncomeByCategory,
            entry => entry.Category is TransactionCategory.Transfer);
        Assert.Equal(1800m, analytics.MonthlyIncomePerPocket.Single(entry => entry.Pocket.Id == 1).Total);
        Assert.Equal(0m, analytics.MonthlyIncomePerPocket.Single(entry => entry.Pocket.Id == 2).Total);
        Assert.Equal(1800m, analytics.TwelveMonthIncomeTrend.Single(entry => entry.Month == 9).Categories[TransactionCategory.Salary]);
        Assert.DoesNotContain(
            analytics.TopMonthlyIncome,
            transaction => transaction.Category is TransactionCategory.Transfer);
    }

    [Fact]
    public void Previous_month_metrics_also_ignore_movements()
    {
        var previousMonth = Now.AddMonths(-1);
        var transactions = new List<Transaction>
        {
            Income(1, 1, TransactionCategory.Salary, 1500, previousMonth.Day, previousMonth.Month),
            Expense(2, 1, TransactionCategory.Food, 200, previousMonth.Day, previousMonth.Month),
            TransferOut(3, 1, 80, previousMonth.Day, previousMonth.Month),
            TransferIn(4, 2, 80, previousMonth.Day, previousMonth.Month),
            Withdraw(5, 1, 30, previousMonth.Day, previousMonth.Month),
            Income(6, 1, TransactionCategory.Salary, 1600, 2),
            Expense(7, 1, TransactionCategory.Food, 50, 2),
        };

        var overview = BuildOverview(transactions, TwoPockets(1000, 80), Now);
        var expenses = BuildExpenseAnalytics(transactions, TwoPockets(1000, 80), Now);
        var income = BuildIncomeAnalytics(transactions, TwoPockets(1000, 80), Now);

        Assert.Equal(-200m, overview.PreviousMonthTotalExpenses);
        Assert.Equal(1500m, overview.PreviousMonthTotalIncome);
        Assert.Equal(200m, expenses.PreviousMonthExpenses);
        Assert.Equal(1500m, income.PreviousMonthIncome);
        Assert.Equal(200m / 1500m, expenses.PreviousMonthSpendingRate);
    }

    [Fact]
    public void Saving_analytics_ignore_transfers_and_count_investments_as_saved()
    {
        var analytics = BuildSavingAnalytics(
            [
                Income(1, 1, TransactionCategory.Salary, 2000, 1),
                Expense(2, 1, TransactionCategory.Food, 500, 10),
                Expense(3, 1, TransactionCategory.Savings, 300, 15),
                Expense(4, 1, TransactionCategory.Investments, 100, 16),
                TransferOut(5, 1, 250, 16),
                TransferIn(6, 2, 250, 16),
                Withdraw(7, 1, 80, 16),
            ],
            Now);

        Assert.Equal(400m, analytics.TotalMonthlySavings);
        Assert.Equal(1500m, analytics.LeftOver);
        Assert.Equal(400m / 2000m, analytics.SavingsRate);
        Assert.Equal(400m / 1500m, analytics.CaptureRate);
        Assert.Equal(300m, analytics.SavingsByCategory[TransactionCategory.Savings]);
        Assert.Equal(100m, analytics.SavingsByCategory[TransactionCategory.Investments]);
        Assert.Equal(
            [TransactionCategory.Savings, TransactionCategory.Investments],
            analytics.TopSavings.Select(entry => entry.Category));
        Assert.DoesNotContain(
            analytics.SavingsByCategory.Keys,
            category => category is TransactionCategory.Transfer or TransactionCategory.Withdraw);
    }

    [Fact]
    public void Saving_analytics_track_leftover_saved_and_rate_per_month()
    {
        var analytics = BuildSavingAnalytics(
            [
                Income(1, 1, TransactionCategory.Salary, 1800, 1, month: 8),
                Expense(2, 1, TransactionCategory.Food, 800, 10, month: 8),
                Expense(3, 1, TransactionCategory.Savings, 200, 15, month: 8),
                Income(4, 1, TransactionCategory.Salary, 2000, 1),
                Expense(5, 1, TransactionCategory.Food, 500, 10),
                Expense(6, 1, TransactionCategory.Savings, 300, 15),
                TransferOut(7, 1, 100, 16),
                TransferIn(8, 2, 100, 16),
            ],
            Now);

        var august = analytics.MonthlySavings.Single(entry => entry.Month == 8);
        var september = analytics.MonthlySavings.Single(entry => entry.Month == 9);
        var october = analytics.MonthlySavings.Single(entry => entry.Month == 10);

        Assert.Equal(1000m, august.Leftover);
        Assert.Equal(200m, august.Saved);
        Assert.Equal(200m / 1800m, august.SavingRate);
        Assert.Equal(1500m, september.Leftover);
        Assert.Equal(300m, september.Saved);
        Assert.Equal(300m / 2000m, september.SavingRate);
        Assert.Equal(0m, october.Leftover);
        Assert.Equal(0m, october.Saved);
        Assert.Equal(0m, october.SavingRate);
        Assert.Equal(12, analytics.MonthlySavings.Count);
        Assert.Equal(300m, analytics.TotalMonthlySavings);
        Assert.Equal(200m, analytics.PreviousMonthSavings);
        Assert.Equal(1500m, analytics.LeftOver);
        Assert.Equal(300m / 2000m, analytics.SavingsRate);
        Assert.Equal(300m / 1500m, analytics.CaptureRate);
    }

    [Fact]
    public void Saving_analytics_use_zero_rates_when_there_is_no_income_or_leftover()
    {
        var analytics = BuildSavingAnalytics(
            [
                Expense(1, 1, TransactionCategory.Food, 50, 10),
            ],
            Now);

        var september = analytics.MonthlySavings.Single(entry => entry.Month == 9);

        Assert.Equal(0m, analytics.TotalMonthlySavings);
        Assert.Equal(-50m, analytics.LeftOver);
        Assert.Equal(0m, analytics.SavingsRate);
        Assert.Equal(0m, analytics.CaptureRate);
        Assert.Equal(-50m, september.Leftover);
        Assert.Equal(0m, september.Saved);
        Assert.Equal(0m, september.SavingRate);
        Assert.Empty(analytics.SavingsByCategory);
        Assert.Empty(analytics.TopSavings);
    }

    private static List<Pocket> TwoPockets(decimal checkingBalance, decimal savingsBalance) =>
        [PocketAt(1, checkingBalance, "Checking"), PocketAt(2, savingsBalance, "Savings")];

    private static Pocket PocketAt(int id, decimal balance, string name = "Pocket") =>
        new()
        {
            Id = id,
            Balance = balance,
            Currency = "EUR",
            Name = name,
        };

    private static Transaction Income(
        int id,
        int pocketId,
        TransactionCategory category,
        decimal amount,
        int day,
        int month = 9) =>
        TransactionAt(id, pocketId, category, amount, day, month);

    private static Transaction Expense(
        int id,
        int pocketId,
        TransactionCategory category,
        decimal amount,
        int day,
        int month = 9) =>
        TransactionAt(id, pocketId, category, -Math.Abs(amount), day, month);

    private static Transaction TransferOut(int id, int pocketId, decimal amount, int day, int month = 9) =>
        TransactionAt(id, pocketId, TransactionCategory.Transfer, -Math.Abs(amount), day, month);

    private static Transaction TransferIn(int id, int pocketId, decimal amount, int day, int month = 9) =>
        TransactionAt(id, pocketId, TransactionCategory.Transfer, Math.Abs(amount), day, month);

    private static Transaction Withdraw(int id, int pocketId, decimal amount, int day, int month = 9) =>
        TransactionAt(id, pocketId, TransactionCategory.Withdraw, -Math.Abs(amount), day, month);

    private static Transaction TransactionAt(
        int id,
        int pocketId,
        TransactionCategory category,
        decimal amount,
        int day,
        int month)
    {
        return new Transaction
        {
            Id = id,
            PocketId = pocketId,
            Category = category,
            Amount = amount,
            Date = new DateTime(2026, month, day, 10, 0, 0, DateTimeKind.Utc),
            Description = category.ToString(),
        };
    }
}
