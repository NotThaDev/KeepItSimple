using static KeepItSimple.Api.Models.Pocket;
using static KeepItSimple.Api.Models.Transaction;

namespace KeepItSimple.Api.Models.Analytics;

public static class Analytics
{
    public static async Task<OverviewAnalytics> GetOverviewAsync(string userId)
    {
        var transactions = await Transaction.GetAllAsync(userId);
        var pockets = await Pocket.GetAllAsync(userId);
        var categories = await LoadCategoriesAsync(userId);

        return BuildOverview(transactions, pockets, DateTime.UtcNow, categories);
    }

    public static OverviewAnalytics BuildOverview(
        IReadOnlyCollection<Transaction> transactions,
        IReadOnlyCollection<Pocket> pockets,
        DateTime now,
        IReadOnlyDictionary<int, Category>? categories = null)
    {
        var kinds = categories ?? NoCategories;
        bool IsExpense(Transaction t) => IsExpenseFor(t);
        bool IsIncome(Transaction t) => IsIncomeFor(t, kinds);

        var previousMonth = now.AddMonths(-1);
        var currentMonthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var currentMonthBalance = pockets.Sum(p => p.Balance);
        var totalExpenses = transactions.Where(IsExpense).Sum(t => t.Amount);
        var totalIncome = transactions.Where(IsIncome).Sum(t => t.Amount);

        var monthlyTransactions = transactions
            .Where(t => t.Date.Year == now.Year && t.Date.Month == now.Month)
            .ToList();
        var previousMonthTransactions = transactions
            .Where(t => t.Date.Year == previousMonth.Year && t.Date.Month == previousMonth.Month)
            .ToList();

        var monthlyExpenses = monthlyTransactions.Where(IsExpense).ToList();
        var monthlyIncome = monthlyTransactions.Where(IsIncome).ToList();
        var monthlyTotalExpenses = monthlyExpenses.Sum(t => t.Amount);
        var monthlyTotalIncome = monthlyIncome.Sum(t => t.Amount);
        var previousMonthlyTotalIncome = previousMonthTransactions.Where(IsIncome).Sum(t => t.Amount);
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

        var thisMonthByDay = monthlyExpenses
            .GroupBy(t => t.Date.Day)
            .ToDictionary(group => group.Key, group => group.Sum(t => t.Amount));
        var lastMonthByDay = previousMonthTransactions
            .Where(IsExpense)
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
            .GroupBy(t => t.CategoryId)
            .Select(g => new TransactionByCategory
            {
                CategoryId = g.Key,
                Total = g.Sum(t => t.Amount)
            })
            .ToList();

        var topExpenseCategory = monthlyExpensesByCategory.OrderByDescending(e => e.Total).FirstOrDefault()?.CategoryId;

        var expensesPerPocketTotals = monthlyExpenses
            .GroupBy(t => t.PocketId)
            .ToDictionary(g => g.Key, g => g.Sum(t => t.Amount));

        var expensesPerPocket = ToPerPocketTotals(pockets, expensesPerPocketTotals);

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
            TopExpenseCategoryId = topExpenseCategory,
            ExpensesPerPocket = expensesPerPocket,
            PreviousMonthTotalBalance = previousMonthBalance
        };
    }

    public static async Task<ExpenseAnalytics> GetExpensesAnalyticsAsync(string userId, int? pocketId = null, int? month = null)
    {
        var pockets = await Pocket.GetAllAsync(userId);
        var transactions = pocketId is null ? await Transaction.GetAllAsync(userId) : await Transaction.GetByPocketIdAsync(pocketId.Value, userId);
        var calendarNow = DateTime.UtcNow;
        return BuildExpenseAnalytics(transactions, pockets, ResolveAnalyticsNow(month, calendarNow), calendarNow, await LoadCategoriesAsync(userId));
    }

    public static ExpenseAnalytics BuildExpenseAnalytics(
        IReadOnlyCollection<Transaction> transactions,
        IReadOnlyCollection<Pocket> pockets,
        DateTime now,
        // Tests only: freezes today apart from the selected month. Production always passes DateTime.UtcNow.
        DateTime? calendarNow = null,
        IReadOnlyDictionary<int, Category>? categories = null)
    {
        var kinds = categories ?? NoCategories;
        bool IsExpense(Transaction t) => IsExpenseFor(t);
        bool IsIncome(Transaction t) => IsIncomeFor(t, kinds);

        var monthlyTransactions = transactions.Where(t => t.Date.Year == now.Year && t.Date.Month == now.Month).ToList();
        var monthlyExpenses = monthlyTransactions.Where(IsExpense).ToList();
        var monthlyTotalExpenses = Math.Abs(monthlyExpenses.Sum(t => t.Amount));

        var previousMonth = now.AddMonths(-1);
        var previousMonthExpenseTransactions = transactions
            .Where(t => IsExpense(t) && t.Date.Year == previousMonth.Year && t.Date.Month == previousMonth.Month)
            .ToList();
        var previousMonthExpenses = Math.Abs(previousMonthExpenseTransactions.Sum(t => t.Amount));

        var daysInMonth = DateTime.DaysInMonth(now.Year, now.Month);
        var dailyBurn = monthlyTotalExpenses / now.Day;
        var monthProjection = dailyBurn * daysInMonth;
        var monthlyIncome = monthlyTransactions.Where(IsIncome).Sum(t => t.Amount);
        var spendingRate = monthlyIncome == 0 ? 0 : monthlyTotalExpenses / monthlyIncome;
        var projectedSpendingRate = monthlyIncome == 0 ? 0 : monthProjection / monthlyIncome;
        var previousMonthIncome = transactions
            .Where(t => IsIncome(t) && t.Date.Year == previousMonth.Year && t.Date.Month == previousMonth.Month)
            .Sum(t => t.Amount);
        var previousMonthSpendingRate = previousMonthIncome == 0 ? 0 : previousMonthExpenses / previousMonthIncome;
        var expensePerDay = monthlyExpenses.GroupBy(t => t.Date.Day).ToDictionary(group => group.Key, group => Math.Abs(group.Sum(t => t.Amount)));

        var thisMonthByDay = monthlyExpenses
            .GroupBy(t => t.Date.Day)
            .ToDictionary(group => group.Key, group => Math.Abs(group.Sum(t => t.Amount)));
        var lastMonthByDay = previousMonthExpenseTransactions
            .GroupBy(t => t.Date.Day)
            .ToDictionary(group => group.Key, group => Math.Abs(group.Sum(t => t.Amount)));
        var daysInPreviousMonth = DateTime.DaysInMonth(previousMonth.Year, previousMonth.Month);
        var maxDays = Math.Max(daysInMonth, daysInPreviousMonth);
        decimal thisMonthCumulative = 0;
        decimal lastMonthCumulative = 0;
        var monthlySpendingPace = Enumerable
            .Range(1, maxDays)
            .Select(day =>
            {
                if (day <= now.Day)
                {
                    thisMonthCumulative += thisMonthByDay.GetValueOrDefault(day, 0);
                }

                if (day <= daysInPreviousMonth)
                {
                    lastMonthCumulative += lastMonthByDay.GetValueOrDefault(day, 0);
                }

                return new ExpenseAnalytics.DailyCumulativeExpense
                {
                    Day = day,
                    ThisMonth = day <= now.Day ? thisMonthCumulative : null,
                    LastMonth = day <= daysInPreviousMonth ? lastMonthCumulative : null
                };
            })
            .ToList();


        var expensesByCategory = monthlyExpenses.GroupBy(t => t.CategoryId).Select(g => new TransactionByCategory
        {
            CategoryId = g.Key,
            Total = g.Sum(t => t.Amount)
        }).ToList().OrderByDescending(t => t.Total).ToList();

        var fixedExpenses = expensesByCategory.Where(t => FixedExpenseCategories.Contains((TransactionCategory)t.CategoryId)).Sum(t => t.Total);

        var calendar = calendarNow ?? now;
        var currentYear = calendar.Year;
        var thisYearByMonth = transactions
            .Where(t => IsExpense(t) && t.Date.Year == currentYear)
            .GroupBy(t => t.Date.Month)
            .ToDictionary(group => group.Key, group => Math.Abs(group.Sum(t => t.Amount)));
        var lastYearByMonth = transactions
            .Where(t => IsExpense(t) && t.Date.Year == currentYear - 1)
            .GroupBy(t => t.Date.Month)
            .ToDictionary(group => group.Key, group => Math.Abs(group.Sum(t => t.Amount)));
        var monthlySpendComparison = Enumerable
            .Range(1, 12)
            .Select(month => new ExpenseAnalytics.MonthlyExpenseComparison
            {
                Month = month,
                ThisYear = month <= calendar.Month ? thisYearByMonth.GetValueOrDefault(month, 0) : null,
                LastYear = lastYearByMonth.GetValueOrDefault(month, 0)
            })
            .ToList();


        var expensePerPocketTotals = monthlyExpenses
            .GroupBy(t => t.PocketId)
            .ToDictionary(group => group.Key, group => Math.Abs(group.Sum(t => t.Amount)));
        var expensePerPocket = ToPerPocketTotals(pockets, expensePerPocketTotals);

        var topExpenses = monthlyExpenses
            .OrderBy(t => t.Amount)
            .Take(5)
            .ToList();
        return new ExpenseAnalytics
        {
            TotalMonthlyExpenses = monthlyTotalExpenses,
            PreviousMonthExpenses = previousMonthExpenses,
            DailyBurn = dailyBurn,
            MonthProjection = monthProjection,
            MonthlyIncome = monthlyIncome,
            SpendingRate = spendingRate,
            ProjectedSpendingRate = projectedSpendingRate,
            PreviousMonthSpendingRate = previousMonthSpendingRate,
            MonthlySpendingPace = monthlySpendingPace,
            MonthlySpendComparison = monthlySpendComparison,
            ExpenseByCategory = expensesByCategory,
            FixedExpenses = fixedExpenses,
            ExpensePerDay = expensePerDay,
            ExpensePerPocket = expensePerPocket,
            TopExpenses = topExpenses,
        };
    }

    public static async Task<IncomeAnalytics> GetIncomeAnalyticsAsync(string userId, int? pocketId = null, int? month = null)
    {
        var pockets = await Pocket.GetAllAsync(userId);
        var transactions = pocketId is null ? await Transaction.GetAllAsync(userId) : await Transaction.GetByPocketIdAsync(pocketId.Value, userId);
        var calendarNow = DateTime.UtcNow;
        return BuildIncomeAnalytics(transactions, pockets, ResolveAnalyticsNow(month, calendarNow), calendarNow, await LoadCategoriesAsync(userId));
    }

    public static IncomeAnalytics BuildIncomeAnalytics(
        IReadOnlyCollection<Transaction> transactions,
        IReadOnlyCollection<Pocket> pockets,
        DateTime now,
        // Tests only: freezes today apart from the selected month. Production always passes DateTime.UtcNow.
        DateTime? calendarNow = null,
        IReadOnlyDictionary<int, Category>? categories = null)
    {
        var kinds = categories ?? NoCategories;
        bool IsExpense(Transaction t) => IsExpenseFor(t);
        bool IsIncome(Transaction t) => IsIncomeFor(t, kinds);

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
        var monthlySavings = Math.Abs(monthlyTransactions.Where(IsSavings).Sum(t => t.Amount));
        var savingsRate = monthlyIncome == 0 ? 0 : monthlySavings / monthlyIncome;

        var monthlyIncomeTransactions = monthlyTransactions.Where(IsIncome).ToList();
        var monthlyPassiveIncome = monthlyIncomeTransactions
            .Where(t => PassiveIncomeCategories.Contains(t.Category))
            .Sum(t => t.Amount);
        var monthlyActiveIncome = monthlyIncomeTransactions
            .Where(t => ActiveIncomeCategories.Contains(t.Category))
            .Sum(t => t.Amount);

        var incomeByCategory = monthlyIncomeTransactions.GroupBy(t => t.CategoryId).Select(g => new TransactionByCategory
        {
            CategoryId = g.Key,
            Total = g.Sum(t => t.Amount)
        }).ToList().OrderByDescending(t => t.Total).ToList();

        var currentYear = (calendarNow ?? now).Year;
        var yearIncomeTotalsByMonthAndCategory = transactions
            .Where(t => t.Date.Year == currentYear && IsIncome(t))
            .GroupBy(t => (t.Date.Month, t.CategoryId))
            .ToDictionary(group => group.Key, group => group.Sum(t => t.Amount));

        var incomeCategoryIds = IncomeCategories.Select(c => (int)c)
            .Concat(kinds.Values.Where(c => !c.IsSystem && c.Kind == CategoryKind.Income).Select(c => c.Id))
            .ToList();
        var yearIncomeByMonth = Enumerable.Range(1, 12)
            .Select(month =>
            {
                var byId = incomeCategoryIds.ToDictionary(
                    id => id,
                    id => yearIncomeTotalsByMonthAndCategory.GetValueOrDefault((month, id), 0));
                // Legacy map: system keys, with custom categories merged into "Other".
                var legacy = new Dictionary<string, decimal>();
                foreach (var (id, total) in byId)
                {
                    var key = Category.LegacyKey(id);
                    legacy[key] = legacy.GetValueOrDefault(key) + total;
                }

                return new MonthlyTransactionByCategory { Month = month, Categories = legacy, CategoryIds = byId };
            })
            .ToList();

        var monthlyIncomePerPocketTotals = monthlyIncomeTransactions
            .GroupBy(t => t.PocketId)
            .ToDictionary(group => group.Key, group => group.Sum(t => t.Amount));
        var monthlyIncomePerPocket = ToPerPocketTotals(pockets, monthlyIncomePerPocketTotals);

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

    public static async Task<SavingAnalytics> GetSavingsAnalyticsAsync(string userId, int? month = null)
    {
        var transactions = await Transaction.GetAllAsync(userId);
        var pockets = await Pocket.GetAllAsync(userId);
        var currency = pockets.FirstOrDefault()?.Currency;
        var calendarNow = DateTime.UtcNow;
        return BuildSavingAnalytics(transactions, ResolveAnalyticsNow(month, calendarNow), currency ?? "EUR", calendarNow, await LoadCategoriesAsync(userId));
    }

    public static SavingAnalytics BuildSavingAnalytics(
        IReadOnlyCollection<Transaction> transactions,
        DateTime now,
        string currency = "EUR",
        // Tests only: freezes today apart from the selected month. Production always passes DateTime.UtcNow.
        DateTime? calendarNow = null,
        IReadOnlyDictionary<int, Category>? categories = null)
    {
        var kinds = categories ?? NoCategories;
        bool IsExpense(Transaction t) => IsExpenseFor(t);
        bool IsIncome(Transaction t) => IsIncomeFor(t, kinds);

        var monthlyTransactions = transactions
            .Where(t => t.Date.Year == now.Year && t.Date.Month == now.Month)
            .ToList();
        var monthlyIncome = monthlyTransactions.Where(IsIncome).Sum(t => t.Amount);
        var monthlyExpenses = Math.Abs(monthlyTransactions.Where(IsExpense).Sum(t => t.Amount));
        var monthlySavingsTransactions = monthlyTransactions.Where(IsSavings).ToList();
        var monthlySavings = Math.Abs(monthlySavingsTransactions.Sum(t => t.Amount));
        var leftover = monthlyIncome - monthlyExpenses;
        var captureRate = leftover == 0 ? 0 : monthlySavings / leftover;

        var previousMonth = now.AddMonths(-1);
        var previousMonthSavings = Math.Abs(
            transactions
                .Where(t => IsSavings(t) && t.Date.Year == previousMonth.Year && t.Date.Month == previousMonth.Month)
                .Sum(t => t.Amount));

        var savingsRate = monthlyIncome == 0 ? 0 : monthlySavings / monthlyIncome;

        var yearTransactions = transactions.Where(t => t.Date.Year == (calendarNow ?? now).Year).ToList();
        var incomeByMonth = yearTransactions
            .Where(IsIncome)
            .GroupBy(t => t.Date.Month)
            .ToDictionary(group => group.Key, group => group.Sum(t => t.Amount));
        var leftoverByMonth = yearTransactions
            .Where(t => IsIncome(t) || IsExpense(t))
            .GroupBy(t => t.Date.Month)
            .ToDictionary(
                group => group.Key,
                group => group.Where(IsIncome).Sum(t => t.Amount)
                    - Math.Abs(group.Where(IsExpense).Sum(t => t.Amount)));
        var savedByMonth = yearTransactions
            .Where(IsSavings)
            .GroupBy(t => t.Date.Month)
            .ToDictionary(group => group.Key, group => Math.Abs(group.Sum(t => t.Amount)));

        var monthlySavingsBreakdown = Enumerable
            .Range(1, 12)
            .Select(month =>
            {
                var income = incomeByMonth.GetValueOrDefault(month, 0);
                var saved = savedByMonth.GetValueOrDefault(month, 0);
                return new SavingAnalytics.MonthlySaving
                {
                    Month = month,
                    Leftover = leftoverByMonth.GetValueOrDefault(month, 0),
                    Saved = saved,
                    SavingRate = income == 0 ? 0 : saved / income,
                };
            })
            .ToList();

        var savingsByCategory = monthlySavingsTransactions
            .GroupBy(t => t.CategoryId)
            .Select(group => new TransactionByCategory
            {
                CategoryId = group.Key,
                Total = Math.Abs(group.Sum(t => t.Amount)),
            })
            .OrderByDescending(entry => entry.Total)
            .ToList();

        var topSavings = savingsByCategory.Take(5).ToList();

        return new SavingAnalytics
        {
            TotalMonthlySavings = monthlySavings,
            PreviousMonthSavings = previousMonthSavings,
            SavingsRate = savingsRate,
            CaptureRate = captureRate,
            LeftOver = leftover,
            MonthlySavings = monthlySavingsBreakdown,
            SavingsByCategory = savingsByCategory,
            TopSavings = topSavings,
            MonthlyExpenses = monthlyExpenses,
            MonthlyIncome = monthlyIncome,
            Currency = currency,
        };
    }

    public static DateTime ResolveAnalyticsNow(int? month, DateTime utcNow)
    {
        if (month is not int selected || selected is < 1 or > 12)
        {
            return utcNow;
        }

        var year = utcNow.Year;
        var daysInMonth = DateTime.DaysInMonth(year, selected);

        if (selected == utcNow.Month)
        {
            return utcNow;
        }

        if (selected < utcNow.Month)
        {
            return new DateTime(year, selected, daysInMonth, 23, 59, 59, DateTimeKind.Utc);
        }

        return new DateTime(year, selected, 1, 0, 0, 0, DateTimeKind.Utc);
    }

    private static List<TransactionPerPocket> ToPerPocketTotals(
        IEnumerable<Pocket> pockets,
        IReadOnlyDictionary<int, decimal> totals) =>
        [.. pockets.Select(pocket => new TransactionPerPocket
        {
            Pocket = pocket,
            Total = totals.GetValueOrDefault(pocket.Id, 0)
        })];

    private static bool IsMovement(Transaction transaction) =>
        transaction.Category is TransactionCategory.Transfer
            or TransactionCategory.Withdraw;

    // System ids keep the enum logic; a custom category's Kind decides income vs expense.
    // Custom categories are in none of the fixed/passive/active splits.
    private static bool IsExpenseFor(Transaction transaction) =>
        transaction.Amount < 0
        && transaction.Category is not TransactionCategory.Savings
        && transaction.Category is not TransactionCategory.Investments
        && !IsMovement(transaction);

    private static bool IsIncomeFor(Transaction transaction, IReadOnlyDictionary<int, Category> categories) =>
        transaction.Amount > 0
        && (IncomeCategories.Contains(transaction.Category) || IsCustomIncome(transaction, categories))
        && !IsMovement(transaction);

    private static bool IsCustomIncome(Transaction transaction, IReadOnlyDictionary<int, Category> categories) =>
        categories.TryGetValue(transaction.CategoryId, out var category)
        && !category.IsSystem
        && category.Kind == CategoryKind.Income;

    private static readonly IReadOnlyDictionary<int, Category> NoCategories = new Dictionary<int, Category>();

    private static async Task<IReadOnlyDictionary<int, Category>> LoadCategoriesAsync(string userId) =>
        (await Category.GetVisibleAsync(userId)).ToDictionary(c => c.Id);

    private static bool IsSavings(Transaction transaction) =>
        transaction.Category is TransactionCategory.Savings || transaction.Category is TransactionCategory.Investments;


    public class TransactionByCategory
    {
        public int CategoryId { get; set; }

        // Legacy field: the system key, "Other" for custom categories.
        public string Category => Models.Category.LegacyKey(CategoryId);
        public decimal Total { get; set; }
    }

    public class MonthlyTransactionByCategory
    {
        public int Month { get; set; }

        // Legacy map keyed by system key; custom categories are merged into "Other".
        public Dictionary<string, decimal> Categories { get; set; } = [];
        public Dictionary<int, decimal> CategoryIds { get; set; } = [];
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

    private static readonly TransactionCategory[] FixedExpenseCategories =
    [
        TransactionCategory.Lease,
        TransactionCategory.Rent,
        TransactionCategory.Mortgage,
        TransactionCategory.Loan,
        TransactionCategory.Insurance,
        TransactionCategory.Phone,
        TransactionCategory.Subscriptions,
    ];
}
