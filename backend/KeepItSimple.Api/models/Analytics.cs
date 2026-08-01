using System.Text.Json.Serialization;
using static KeepItSimple.Api.Models.Transaction;

namespace KeepItSimple.Api.Models;

public class Analytics
{
    public decimal CurrentMonthTotalBalance { get; set; }
    public decimal TotalExpenses { get; set; }
    public decimal TotalIncome { get; set; }
    public decimal MonthlyTotalExpenses { get; set; }
    public decimal MonthlyTotalIncome { get; set; }
    public decimal PreviousMonthTotalExpenses { get; set; }
    public decimal PreviousMonthTotalIncome { get; set; }
    public decimal PreviousMonthTotalBalance { get; set; }
    public List<DailyExpenseComparison> MonthlyExpensesDailyComparison { get; set; } = [];
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public TransactionCategory? TopExpenseCategory { get; set; }
    public List<ExpenseByCategory> MonthlyExpensesByCategory { get; set; } = [];
    public List<ExpensePerPocket> ExpensesPerPocket { get; set; } = [];

    public static async Task<Analytics> GetMonthlyAnalyticsAsync()
    {
        var transactionsTask = GetAllAsync();
        var pocketsTask = Pocket.GetAllAsync();
        await Task.WhenAll(transactionsTask, pocketsTask);

        var transactions = transactionsTask.Result;
        var pockets = pocketsTask.Result;
        var now = DateTime.UtcNow;
        var previousMonth = now.AddMonths(-1);
        var currentMonthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var currentMonthBalance = pockets.Sum(p => p.Balance);
        var totalExpenses = transactions.Where(t => t.Amount < 0).Sum(t => t.Amount);
        var totalIncome = transactions.Where(t => t.Amount > 0).Sum(t => t.Amount);

        var monthlyTransactions = transactions
            .Where(t => t.Date.Year == now.Year && t.Date.Month == now.Month)
            .ToList();
        var previousMonthTransactions = transactions
            .Where(t => t.Date.Year == previousMonth.Year && t.Date.Month == previousMonth.Month)
            .ToList();

        var monthlyExpenses = monthlyTransactions.Where(t => t.Amount < 0).ToList();
        var monthlyIncome = monthlyTransactions.Where(t => t.Amount > 0).ToList();
        var monthlyTotalExpenses = monthlyExpenses.Sum(t => t.Amount);
        var monthlyTotalIncome = monthlyIncome.Sum(t => t.Amount);
        var previousMonthlyTotalIncome = previousMonthTransactions.Where(t => t.Amount > 0).Sum(t => t.Amount);
        var previousMonthlyTotalExpenses = previousMonthTransactions.Where(t => t.Amount < 0).Sum(t => t.Amount);

        var currentMonthNetByPocket = monthlyTransactions
            .GroupBy(t => t.PocketId)
            .ToDictionary(group => group.Key, group => group.Sum(t => t.Amount));
        var pocketsWithHistoryBeforeCurrentMonth = transactions
            .Where(t => t.Date < currentMonthStart)
            .Select(t => t.PocketId)
            .ToHashSet();

        var previousMonthBalance = pockets
            .Where(pocket => pocketsWithHistoryBeforeCurrentMonth.Contains(pocket.Id))
            .Sum(pocket => pocket.Balance - currentMonthNetByPocket.GetValueOrDefault(pocket.Id, 0));

        var thisMonthByDay = monthlyTransactions
            .GroupBy(t => t.Date.Day)
            .ToDictionary(group => group.Key, group => group.Sum(t => t.Amount));
        var lastMonthByDay = previousMonthTransactions
            .GroupBy(t => t.Date.Day)
            .ToDictionary(group => group.Key, group => group.Sum(t => t.Amount));
        var maxDays = Math.Max(
            DateTime.DaysInMonth(now.Year, now.Month),
            DateTime.DaysInMonth(previousMonth.Year, previousMonth.Month)
        );
        var monthlyExpensesDailyComparison = Enumerable
            .Range(1, maxDays)
            .Select(day => new DailyExpenseComparison
            {
                Day = day,
                ThisMonth = thisMonthByDay.GetValueOrDefault(day, 0),
                LastMonth = lastMonthByDay.GetValueOrDefault(day, 0)
            })
            .ToList();

        var monthlyExpensesByCategory = monthlyExpenses
            .GroupBy(t => t.Category)
            .Select(g => new ExpenseByCategory
            {
                Category = g.Key,
                Total = g.Sum(t => t.Amount)
            })
            .ToList();

        var topExpenseCategory = monthlyExpensesByCategory.OrderByDescending(e => e.Total).FirstOrDefault()?.Category;

        var expensesPerPocketTotals = monthlyExpenses
            .GroupBy(t => t.PocketId)
            .ToDictionary(g => g.Key, g => g.Sum(t => t.Amount));

        var expensesPerPocket = pockets
            .Select(pocket => new ExpensePerPocket
            {
                Pocket = pocket,
                TotalExpenses = expensesPerPocketTotals.GetValueOrDefault(pocket.Id, 0)
            })
            .ToList();

        return new Analytics
        {
            TotalExpenses = totalExpenses,
            TotalIncome = totalIncome,
            MonthlyTotalExpenses = monthlyTotalExpenses,
            MonthlyTotalIncome = monthlyTotalIncome,
            PreviousMonthTotalExpenses = previousMonthlyTotalExpenses,
            PreviousMonthTotalIncome = previousMonthlyTotalIncome,
            CurrentMonthTotalBalance = currentMonthBalance,
            MonthlyExpensesDailyComparison = monthlyExpensesDailyComparison,
            MonthlyExpensesByCategory = monthlyExpensesByCategory,
            TopExpenseCategory = topExpenseCategory,
            ExpensesPerPocket = expensesPerPocket,
            PreviousMonthTotalBalance = previousMonthBalance
        };
    }

    public class ExpenseByCategory
    {
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public TransactionCategory Category { get; set; }
        public decimal Total { get; set; }
    }

    public class ExpensePerPocket
    {
        public Pocket Pocket { get; set; } = null!;
        public decimal TotalExpenses { get; set; }
    }

    public class DailyExpenseComparison
    {
        public int Day { get; set; }
        public decimal ThisMonth { get; set; }
        public decimal LastMonth { get; set; }
    }
}