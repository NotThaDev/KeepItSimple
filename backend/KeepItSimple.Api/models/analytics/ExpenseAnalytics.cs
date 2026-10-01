using static KeepItSimple.Api.Models.Analytics.Analytics;

namespace KeepItSimple.Api.Models.Analytics;

public class ExpenseAnalytics
{
    public decimal TotalMonthlyExpenses { get; set; }
    public decimal PreviousMonthExpenses { get; set; }
    public decimal DailyBurn { get; set; }
    public decimal MonthProjection { get; set; }
    public decimal MonthlyIncome { get; set; }
    public decimal SpendingRate { get; set; }
    public decimal ProjectedSpendingRate { get; set; }
    public decimal PreviousMonthSpendingRate { get; set; }
    public decimal FixedExpenses { get; set; }
    public List<Transaction> TopExpenses { get; set; } = [];
    public Dictionary<int, decimal> ExpensePerDay { get; set; } = [];
    public List<TransactionByCategory> ExpenseByCategory { get; set; } = [];
    public List<DailyCumulativeExpense> MonthlySpendingPace { get; set; } = [];
    public List<MonthlyExpenseComparison> MonthlySpendComparison { get; set; } = [];
    public List<TransactionPerPocket> ExpensePerPocket { get; set; } = [];

    public class DailyCumulativeExpense
    {
        public int Day { get; set; }
        public decimal? ThisMonth { get; set; }
        public decimal? LastMonth { get; set; }
    }

    public class MonthlyExpenseComparison
    {
        public int Month { get; set; }
        public decimal? ThisYear { get; set; }
        public decimal LastYear { get; set; }
    }
}
