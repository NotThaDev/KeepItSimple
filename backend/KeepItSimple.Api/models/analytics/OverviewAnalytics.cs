using static KeepItSimple.Api.Models.Analytics.Analytics;

namespace KeepItSimple.Api.Models.Analytics;

public class OverviewAnalytics
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
    public int? TopExpenseCategoryId { get; set; }

    // Legacy field: the system key, "Other" for custom categories.
    public string? TopExpenseCategory => TopExpenseCategoryId is { } id ? Category.LegacyKey(id) : null;
    public List<TransactionByCategory> MonthlyExpensesByCategory { get; set; } = [];
    public List<TransactionPerPocket> ExpensesPerPocket { get; set; } = [];

    public class DailyExpenseComparison
    {
        public int Day { get; set; }
        public decimal ThisMonth { get; set; }
        public decimal LastMonth { get; set; }
    }
}
