using System.Text.Json.Serialization;
using static KeepItSimple.Api.Models.Transaction;

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
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public TransactionCategory? TopExpenseCategory { get; set; }
    public List<ExpenseByCategory> MonthlyExpensesByCategory { get; set; } = [];
    public List<ExpensePerPocket> ExpensesPerPocket { get; set; } = [];

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
