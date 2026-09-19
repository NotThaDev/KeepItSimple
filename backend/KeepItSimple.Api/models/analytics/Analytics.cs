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
            .Select(g => new OverviewAnalytics.ExpenseByCategory
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
            .ConvertAll(pocket => new OverviewAnalytics.ExpensePerPocket
            {
                Pocket = pocket,
                TotalExpenses = expensesPerPocketTotals.GetValueOrDefault(pocket.Id, 0)
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

    private static bool IsExpense(Transaction transaction) =>
        transaction.Amount < 0
        && transaction.Category is not TransactionCategory.Savings
        && transaction.Category is not TransactionCategory.Investments;
}
