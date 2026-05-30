using System.Text.Json.Serialization;
using static KeepItSimple.Api.Models.Transaction;

namespace KeepItSimple.Api.Models;

public class Analytics
{
    public decimal CurrentMonthTotalBalance { get; set; }
    public decimal TotalExpenses { get; set; }
    public decimal TotalIncome { get; set; }
    public decimal MonthlyTotalExpenses { get; set; }
    public decimal PreviousMonthTotalExpenses { get; set; }
    public List<DailyExpenseComparison> MonthlyExpensesDailyComparison { get; set; } = [];
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public TransactionCategory? TopExpenseCategory { get; set; }
    public List<ExpenseByCategory> ExpensesByCategory { get; set; } = [];
    public List<ExpenseByCategory> MonthlyExpensesByCategory { get; set; } = [];
    public List<ExpensePerPocket> ExpensesPerPocket { get; set; } = [];

    public static async Task<Analytics> GetAsync()
    {
        var transactionsTask = GetAllAsync();
        var pocketsTask = Pocket.GetAllAsync();
        await Task.WhenAll(transactionsTask, pocketsTask);

        var transactions = transactionsTask.Result;
        var pockets = pocketsTask.Result;
        var now = DateTime.UtcNow;
        var previousMonth = now.AddMonths(-1);

        var currentMonthBalance = pockets.Sum(p => p.Balance);
        var totalExpenses = transactions.Sum(t => t.Amount);
        var totalIncome = 0; // For now, we only have expenses, so income is 0. This can be updated when income transactions are implemented.
        var monthlyTransactions = transactions
            .Where(t => t.Date.Year == now.Year && t.Date.Month == now.Month)
            .ToList();
        var previousMonthTransactions = transactions
            .Where(t => t.Date.Year == previousMonth.Year && t.Date.Month == previousMonth.Month)
            .ToList();
        var monthlyTotalExpenses = monthlyTransactions.Sum(t => t.Amount);
        var previousMonthlyTotalExpenses = previousMonthTransactions.Sum(t => t.Amount);

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

        var expensesByCategory = transactions
            .GroupBy(t => t.Category)
            .Select(g => new ExpenseByCategory
            {
                Category = g.Key,
                Total = g.Sum(t => t.Amount)
            })
            .ToList();

        var monthlyExpensesByCategory = monthlyTransactions
            .GroupBy(t => t.Category)
            .Select(g => new ExpenseByCategory
            {
                Category = g.Key,
                Total = g.Sum(t => t.Amount)
            })
            .ToList();

        var topExpenseCategory = expensesByCategory.OrderBy(e => e.Total).FirstOrDefault()?.Category;

        var expensesPerPocketTotals = transactions
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
            PreviousMonthTotalExpenses = previousMonthlyTotalExpenses,
            CurrentMonthTotalBalance = currentMonthBalance,
            MonthlyExpensesDailyComparison = monthlyExpensesDailyComparison,
            ExpensesByCategory = expensesByCategory,
            MonthlyExpensesByCategory = monthlyExpensesByCategory,
            TopExpenseCategory = topExpenseCategory,
            ExpensesPerPocket = expensesPerPocket
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