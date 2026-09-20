using static KeepItSimple.Api.Models.Analytics.Analytics;
using static KeepItSimple.Api.Models.Transaction;

namespace KeepItSimple.Api.Models.Analytics;

public class SavingAnalytics
{
    public decimal TotalMonthlySavings { get; set; }
    public decimal PreviousMonthSavings { get; set; }
    public decimal SavingsRate { get; set; }
    public decimal CaptureRate { get; set; }
    public decimal LeftOver { get; set; }
    public List<MonthlySaving> MonthlySavings { get; set; } = [];
    public Dictionary<TransactionCategory, decimal> SavingsByCategory { get; set; } = [];
    public List<TransactionByCategory> TopSavings { get; set; } = [];
    public class MonthlySaving
    {
        public int Month { get; set; }
        public decimal? Leftover { get; set; }
        public decimal? Saved { get; set; }
        public decimal? SavingRate { get; set; }
    }
}
