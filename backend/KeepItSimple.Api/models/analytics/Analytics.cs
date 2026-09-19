using System.Text.Json.Serialization;
using static KeepItSimple.Api.Models.Pocket;
using static KeepItSimple.Api.Models.Transaction;

namespace KeepItSimple.Api.Models.Analytics;

public static class Analytics
{
    public static async Task<OverviewAnalytics> GetOverviewAsync()
    {
        var transactionsTask = Transaction.GetAllAsync();
        var pocketsTask = Pocket.GetAllAsync();
        await Task.WhenAll(transactionsTask, pocketsTask);

        var transactions = transactionsTask.Result;
        var pockets = pocketsTask.Result;
        var now = DateTime.UtcNow;
        var previousMonth = now.AddMonths(-1);
        var currentMonthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var currentMonthBalance = pockets.Sum(p => p.Balance);
        var totalExpenses = transactions.Where(IsExpense).Sum(t => t.Amount);
        var totalIncome = transactions.Where(t => t.Amount > 0).Sum(t => t.Amount);

        var monthlyTransactions = transactions
            .Where(t => t.Date.Year == now.Year && t.Date.Month == now.Month)
            .ToList();
        var previousMonthTransactions = transactions
            .Where(t => t.Date.Year == previousMonth.Year && t.Date.Month == previousMonth.Month)
            .ToList();

        var monthlyExpenses = monthlyTransactions.Where(IsExpense).ToList();
        var monthlyIncome = monthlyTransactions.Where(t => t.Amount > 0).ToList();
        var monthlyTotalExpenses = monthlyExpenses.Sum(t => t.Amount);
        var monthlyTotalIncome = monthlyIncome.Sum(t => t.Amount);
        var previousMonthlyTotalIncome = previousMonthTransactions.Where(t => t.Amount > 0).Sum(t => t.Amount);
        var previousMonthlyTotalExpenses = previousMonthTransactions.Where(IsExpense).Sum(t => t.Amount);

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
            .Select(day => new OverviewAnalytics.DailyExpenseComparison
            {
                Day = day,
                ThisMonth = thisMonthByDay.GetValueOrDefault(day, 0),
                LastMonth = lastMonthByDay.GetValueOrDefault(day, 0)
            })
            .ToList();

        var monthlyExpensesByCategory = monthlyExpenses
            .GroupBy(t => t.Category)
            .Select(g => new TransactionByCategory
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
            .ConvertAll(pocket => new TransactionPerPocket
            {
                Pocket = pocket,
                Total = expensesPerPocketTotals.GetValueOrDefault(pocket.Id, 0)
            });

        return new OverviewAnalytics
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

    public static async Task GetExpensesAnalyticsAsync(int? pocketId = null) { }

    public static async Task<IncomeAnalytics> GetIncomeAnalyticsAsync(int? pocketId = null)
    {
        var pockets = await Pocket.GetAllAsync();
        var transactions = pocketId is null ? await Transaction.GetAllAsync() : await Transaction.GetByPocketIdAsync(pocketId.Value);
        var now = DateTime.UtcNow;
        var monthlyTransactions = transactions.Where(t => t.Date.Year == now.Year && t.Date.Month == now.Month).ToList();
        var monthlyIncome = monthlyTransactions.Where(IsIncome).Sum(t => t.Amount);

        var previousMonth = now.AddMonths(-1);
        var previousMonthIncome = transactions.Where(t => IsIncome(t) && t.Date.Year == previousMonth.Year && t.Date.Month == previousMonth.Month).Sum(t => t.Amount);

        var sixMonthAverageIncome = Enumerable.Range(0, 6)
            .Average(offset =>
            {
                var month = now.AddMonths(-offset);
                return transactions
                    .Where(t => IsIncome(t) && t.Date.Year == month.Year && t.Date.Month == month.Month)
                    .Sum(t => t.Amount);
            });

        var monthlyExpenseTotal = Math.Abs(monthlyTransactions.Where(IsExpense).Sum(t => t.Amount));
        var monthlyNetIncome = monthlyIncome - monthlyExpenseTotal;
        var savingsRate = monthlyIncome == 0 ? 0 : (monthlyNetIncome / monthlyIncome);

        var monthlyIncomeTransactions = monthlyTransactions.Where(IsIncome).ToList();
        var monthlyPassiveIncome = monthlyIncomeTransactions
            .Where(t => PassiveIncomeCategories.Contains(t.Category))
            .Sum(t => t.Amount);
        var monthlyActiveIncome = monthlyIncomeTransactions
            .Where(t => ActiveIncomeCategories.Contains(t.Category))
            .Sum(t => t.Amount);

        var incomeByCategory = monthlyIncomeTransactions.GroupBy(t => t.Category).Select(g => new TransactionByCategory
        {
            Category = g.Key,
            Total = g.Sum(t => t.Amount)
        }).ToList().OrderByDescending(t => t.Total).ToList();

        var currentYear = now.Year;
        var yearIncomeTotalsByMonthAndCategory = transactions
            .Where(t => t.Date.Year == currentYear && IsIncome(t))
            .GroupBy(t => (t.Date.Month, t.Category))
            .ToDictionary(group => group.Key, group => group.Sum(t => t.Amount));

        var yearIncomeByMonth = Enumerable.Range(1, 12)
            .Select(month => new MonthlyTransactionByCategory
            {
                Month = month,
                Categories = IncomeCategories.ToDictionary(
                    category => category,
                    category => yearIncomeTotalsByMonthAndCategory.GetValueOrDefault((month, category), 0)
                )
            })
            .ToList();

        var monthlyIncomePerPocketTotals = monthlyIncomeTransactions
            .GroupBy(t => t.PocketId)
            .ToDictionary(group => group.Key, group => group.Sum(t => t.Amount));
        var monthlyIncomePerPocket = pockets.ConvertAll(pocket => new TransactionPerPocket
        {
            Pocket = pocket,
            Total = monthlyIncomePerPocketTotals.GetValueOrDefault(pocket.Id, 0)
        });

        var topMonthlyIncome = monthlyIncomeTransactions
            .OrderByDescending(t => t.Amount)
            .Take(5)
            .ToList();

        return new IncomeAnalytics
        {
            TotalMonthlyIncome = monthlyIncome,
            PreviousMonthIncome = previousMonthIncome,
            SixMonthAverageIncome = sixMonthAverageIncome,
            SavingsRate = savingsRate,
            MonthlyActiveIncome = monthlyActiveIncome,
            MonthlyPassiveIncome = monthlyPassiveIncome,
            MonthlyIncomeByCategory = incomeByCategory,
            TwelveMonthIncomeTrend = yearIncomeByMonth,
            MonthlyIncomePerPocket = monthlyIncomePerPocket,
            TopMonthlyIncome = topMonthlyIncome,
            MonthlyExpenses = monthlyExpenseTotal,
            NetMonthlyIncome = monthlyNetIncome,
        };

    }

    private static bool IsExpense(Transaction transaction) =>
        transaction.Amount < 0
        && transaction.Category is not TransactionCategory.Savings
        && transaction.Category is not TransactionCategory.Investments;

    private static bool IsIncome(Transaction transaction) =>
        transaction.Amount > 0 && IncomeCategories.Contains(transaction.Category);


    public class TransactionByCategory
    {
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public TransactionCategory Category { get; set; }
        public decimal Total { get; set; }
    }

    public class MonthlyTransactionByCategory
    {
        public int Month { get; set; }
        public Dictionary<TransactionCategory, decimal> Categories { get; set; } = [];
    }

    public class TransactionPerPocket
    {
        public Pocket Pocket { get; set; } = null!;
        public decimal Total { get; set; }
    }

    private static readonly TransactionCategory[] IncomeCategories =
    [
        TransactionCategory.Salary,
        TransactionCategory.Bonus,
        TransactionCategory.Freelance,
        TransactionCategory.Business,
        TransactionCategory.Interest,
        TransactionCategory.Dividends,
        TransactionCategory.RentalIncome,
        TransactionCategory.Refund,
        TransactionCategory.Investments,
    ];

    private static readonly TransactionCategory[] PassiveIncomeCategories =
    [
        TransactionCategory.Interest,
        TransactionCategory.Dividends,
        TransactionCategory.RentalIncome,
        TransactionCategory.Refund,
        TransactionCategory.Investments,
    ];

    private static readonly TransactionCategory[] ActiveIncomeCategories =
    [
        TransactionCategory.Salary,
        TransactionCategory.Bonus,
        TransactionCategory.Freelance,
        TransactionCategory.Business,
    ];
}
