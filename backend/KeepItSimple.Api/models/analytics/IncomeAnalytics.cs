using static KeepItSimple.Api.Models.Analytics.Analytics;

namespace KeepItSimple.Api.Models.Analytics;

public class IncomeAnalytics
{
    public decimal TotalMonthlyIncome { get; set; }
    public decimal NetMonthlyIncome { get; set; }
    public decimal MonthlyExpenses { get; set; }
    public decimal PreviousMonthIncome { get; set; }
    public decimal SixMonthAverageIncome { get; set; }
    public decimal SavingsRate { get; set; }
    public decimal MonthlyActiveIncome { get; set; }
    public decimal MonthlyPassiveIncome { get; set; }
    public List<TransactionByCategory> MonthlyIncomeByCategory { get; set; } = [];
    public List<MonthlyTransactionByCategory> TwelveMonthIncomeTrend { get; set; } = [];
    public List<TransactionPerPocket> MonthlyIncomePerPocket { get; set; } = [];
    public List<Transaction> TopMonthlyIncome { get; set; } = [];
}