using System.Globalization;
using System.Text.Json.Serialization;
using static KeepItSimple.Api.Models.Transaction;

namespace KeepItSimple.Api.Models;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum AnalyticsKind
{
    Income,
    Spending,
    Savings,
    Investments,
    Interest
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum AnalyticsTimeRange
{
    CurrentMonth,
    LastMonth,
    Last3Months,
    Last6Months,
    LastYear,
    AllTime
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum AnalyticsGranularity
{
    Day,
    Month
}

public partial class Analytics
{
    public class PeriodInsight
    {
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public AnalyticsKind Kind { get; set; }
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public AnalyticsTimeRange Range { get; set; }
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public AnalyticsGranularity Granularity { get; set; }
        public DateTime From { get; set; }
        public DateTime To { get; set; }
        public DateTime? ComparisonFrom { get; set; }
        public DateTime? ComparisonTo { get; set; }
        public bool HasComparison { get; set; }
        public decimal CurrentTotal { get; set; }
        public decimal PreviousTotal { get; set; }
        public decimal ChangeAmount { get; set; }
        public decimal? ChangePercent { get; set; }
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public TransactionCategory? TopCategory { get; set; }
        public List<AmountByCategory> ByCategory { get; set; } = [];
        public List<AmountByPocket> ByPocket { get; set; } = [];
        public List<SeriesPoint> Series { get; set; } = [];
        public string Currency { get; set; } = "EUR";
    }

    public class AmountByCategory
    {
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public TransactionCategory Category { get; set; }
        public decimal Total { get; set; }
    }

    public class AmountByPocket
    {
        public Pocket Pocket { get; set; } = null!;
        public decimal Total { get; set; }
    }

    public class SeriesPoint
    {
        public string Label { get; set; } = string.Empty;
        public string? ComparisonLabel { get; set; }
        public decimal Total { get; set; }
        public decimal PreviousTotal { get; set; }
    }

    public static Task<PeriodInsight> GetIncomeAnalyticsAsync(AnalyticsTimeRange range) =>
        GetPeriodAnalyticsAsync(AnalyticsKind.Income, range);

    public static Task<PeriodInsight> GetSpendingAnalyticsAsync(AnalyticsTimeRange range) =>
        GetPeriodAnalyticsAsync(AnalyticsKind.Spending, range);

    public static Task<PeriodInsight> GetSavingsAnalyticsAsync(AnalyticsTimeRange range) =>
        GetPeriodAnalyticsAsync(AnalyticsKind.Savings, range);

    public static Task<PeriodInsight> GetInvestmentsAnalyticsAsync(AnalyticsTimeRange range) =>
        GetPeriodAnalyticsAsync(AnalyticsKind.Investments, range);

    public static Task<PeriodInsight> GetInterestAnalyticsAsync(AnalyticsTimeRange range) =>
        GetPeriodAnalyticsAsync(AnalyticsKind.Interest, range);

    public static async Task<PeriodInsight> GetPeriodAnalyticsAsync(
        AnalyticsKind kind,
        AnalyticsTimeRange range)
    {
        var (transactions, pockets) = await LoadTransactionsAndPocketsAsync();
        return ComputePeriodInsight(kind, range, transactions, pockets, DateTime.UtcNow);
    }

    public static PeriodInsight ComputePeriodInsight(
        AnalyticsKind kind,
        AnalyticsTimeRange range,
        IReadOnlyList<Transaction> transactions,
        IReadOnlyList<Pocket> pockets,
        DateTime now)
    {
        ArgumentNullException.ThrowIfNull(transactions);
        ArgumentNullException.ThrowIfNull(pockets);

        if (now.Kind == DateTimeKind.Unspecified)
        {
            now = DateTime.SpecifyKind(now, DateTimeKind.Utc);
        }
        else if (now.Kind == DateTimeKind.Local)
        {
            now = now.ToUniversalTime();
        }

        var window = ResolveWindow(range, now, transactions);
        var current = transactions
            .Where(transaction => MatchesKind(transaction, kind) && InRange(transaction.Date, window.From, window.ToExclusive))
            .ToList();
        var previous = window.ComparisonFrom is DateTime comparisonFrom
            && window.ComparisonToExclusive is DateTime comparisonToExclusive
            ? transactions
                .Where(transaction => MatchesKind(transaction, kind)
                    && InRange(transaction.Date, comparisonFrom, comparisonToExclusive))
                .ToList()
            : [];

        decimal AmountOf(Transaction transaction) => MetricAmount(transaction, kind);

        var currentTotal = current.Sum(AmountOf);
        var previousTotal = previous.Sum(AmountOf);
        var changeAmount = currentTotal - previousTotal;
        decimal? changePercent = previousTotal == 0
            ? currentTotal == 0 ? 0 : null
            : Math.Round(changeAmount / previousTotal * 100, 2, MidpointRounding.AwayFromZero);

        var byCategory = current
            .GroupBy(transaction => transaction.Category)
            .Select(group => new AmountByCategory
            {
                Category = group.Key,
                Total = group.Sum(AmountOf)
            })
            .Where(entry => entry.Total != 0)
            .OrderByDescending(entry => entry.Total)
            .ToList();

        var totalsByPocket = current
            .GroupBy(transaction => transaction.PocketId)
            .ToDictionary(group => group.Key, group => group.Sum(AmountOf));

        var byPocket = pockets
            .Select(pocket => new AmountByPocket
            {
                Pocket = pocket,
                Total = totalsByPocket.GetValueOrDefault(pocket.Id, 0)
            })
            .ToList();

        var granularity = range is AnalyticsTimeRange.CurrentMonth or AnalyticsTimeRange.LastMonth
            ? AnalyticsGranularity.Day
            : AnalyticsGranularity.Month;

        return new PeriodInsight
        {
            Kind = kind,
            Range = range,
            Granularity = granularity,
            From = window.From,
            To = window.ToExclusive.AddTicks(-1),
            ComparisonFrom = window.ComparisonFrom,
            ComparisonTo = window.ComparisonToExclusive?.AddTicks(-1),
            HasComparison = window.ComparisonFrom.HasValue,
            CurrentTotal = currentTotal,
            PreviousTotal = previousTotal,
            ChangeAmount = changeAmount,
            ChangePercent = changePercent,
            TopCategory = byCategory.Count == 0 ? null : byCategory[0].Category,
            ByCategory = byCategory,
            ByPocket = byPocket,
            Series = granularity == AnalyticsGranularity.Day
                ? BuildDailySeries(current, previous, window, AmountOf)
                : BuildMonthlySeries(current, previous, window, AmountOf),
            Currency = pockets.FirstOrDefault()?.Currency ?? "EUR"
        };
    }

    private static async Task<(List<Transaction> Transactions, List<Pocket> Pockets)> LoadTransactionsAndPocketsAsync()
    {
        var transactionsTask = GetAllAsync();
        var pocketsTask = Pocket.GetAllAsync();
        await Task.WhenAll(transactionsTask, pocketsTask);
        return (await transactionsTask, await pocketsTask);
    }

    private readonly record struct AnalyticsWindow(
        DateTime From,
        DateTime ToExclusive,
        DateTime? ComparisonFrom,
        DateTime? ComparisonToExclusive);

    private static AnalyticsWindow ResolveWindow(
        AnalyticsTimeRange range,
        DateTime now,
        IReadOnlyList<Transaction> transactions)
    {
        var currentMonthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var nextMonthStart = currentMonthStart.AddMonths(1);

        return range switch
        {
            AnalyticsTimeRange.CurrentMonth => new AnalyticsWindow(
                currentMonthStart,
                nextMonthStart,
                currentMonthStart.AddMonths(-1),
                currentMonthStart),
            AnalyticsTimeRange.LastMonth => new AnalyticsWindow(
                currentMonthStart.AddMonths(-1),
                currentMonthStart,
                currentMonthStart.AddMonths(-2),
                currentMonthStart.AddMonths(-1)),
            AnalyticsTimeRange.Last3Months => TrailingMonths(currentMonthStart, nextMonthStart, 3),
            AnalyticsTimeRange.Last6Months => TrailingMonths(currentMonthStart, nextMonthStart, 6),
            AnalyticsTimeRange.LastYear => TrailingMonths(currentMonthStart, nextMonthStart, 12),
            AnalyticsTimeRange.AllTime => new AnalyticsWindow(
                EarliestMonthStart(transactions, currentMonthStart),
                nextMonthStart,
                null,
                null),
            _ => throw new ArgumentOutOfRangeException(nameof(range), range, "Unknown analytics time range.")
        };
    }

    private static AnalyticsWindow TrailingMonths(
        DateTime currentMonthStart,
        DateTime nextMonthStart,
        int monthCount)
    {
        var from = currentMonthStart.AddMonths(1 - monthCount);
        return new AnalyticsWindow(from, nextMonthStart, from.AddMonths(-monthCount), from);
    }

    private static DateTime EarliestMonthStart(IReadOnlyList<Transaction> transactions, DateTime fallback)
    {
        if (transactions.Count == 0)
        {
            return fallback;
        }

        var earliest = transactions.Min(transaction => transaction.Date);
        return new DateTime(earliest.Year, earliest.Month, 1, 0, 0, 0, DateTimeKind.Utc);
    }

    private static bool MatchesKind(Transaction transaction, AnalyticsKind kind) => kind switch
    {
        AnalyticsKind.Income => IsIncome(transaction),
        AnalyticsKind.Spending => IsExpense(transaction),
        AnalyticsKind.Savings => transaction.Category == TransactionCategory.Savings,
        AnalyticsKind.Investments => transaction.Category == TransactionCategory.Investments,
        AnalyticsKind.Interest => transaction.Category is TransactionCategory.Interest
            or TransactionCategory.Dividends,
        _ => false
    };

    private static bool IsIncome(Transaction transaction) =>
        transaction.Amount > 0
        && transaction.Category is not TransactionCategory.Savings
        && transaction.Category is not TransactionCategory.Investments;

    private static decimal MetricAmount(Transaction transaction, AnalyticsKind kind) =>
        kind is AnalyticsKind.Spending or AnalyticsKind.Savings or AnalyticsKind.Investments
            ? Math.Abs(transaction.Amount)
            : transaction.Amount;

    private static bool InRange(DateTime date, DateTime from, DateTime toExclusive) =>
        date >= from && date < toExclusive;

    private static List<SeriesPoint> BuildDailySeries(
        List<Transaction> current,
        List<Transaction> previous,
        AnalyticsWindow window,
        Func<Transaction, decimal> amountOf)
    {
        var currentByDay = TotalsByDay(current, amountOf);
        var previousByDay = TotalsByDay(previous, amountOf);
        var currentDays = DateTime.DaysInMonth(window.From.Year, window.From.Month);
        var previousDays = window.ComparisonFrom is DateTime comparisonFrom
            ? DateTime.DaysInMonth(comparisonFrom.Year, comparisonFrom.Month)
            : currentDays;
        var maxDays = Math.Max(currentDays, previousDays);

        return Enumerable
            .Range(1, maxDays)
            .Select(day => new SeriesPoint
            {
                Label = day.ToString(CultureInfo.InvariantCulture),
                ComparisonLabel = window.ComparisonFrom is null
                    ? null
                    : day.ToString(CultureInfo.InvariantCulture),
                Total = currentByDay.GetValueOrDefault(day, 0),
                PreviousTotal = previousByDay.GetValueOrDefault(day, 0)
            })
            .ToList();
    }

    private static List<SeriesPoint> BuildMonthlySeries(
        List<Transaction> current,
        List<Transaction> previous,
        AnalyticsWindow window,
        Func<Transaction, decimal> amountOf)
    {
        var currentMonths = MonthStarts(window.From, window.ToExclusive);
        var comparisonMonths = window.ComparisonFrom is DateTime comparisonFrom
            && window.ComparisonToExclusive is DateTime comparisonToExclusive
            ? MonthStarts(comparisonFrom, comparisonToExclusive)
            : [];
        var currentTotals = TotalsByMonth(current, amountOf);
        var previousTotals = TotalsByMonth(previous, amountOf);

        return currentMonths
            .Select((month, index) =>
            {
                DateTime? comparisonMonth = index < comparisonMonths.Count ? comparisonMonths[index] : null;
                return new SeriesPoint
                {
                    Label = month.ToString("MMM yyyy", CultureInfo.InvariantCulture),
                    ComparisonLabel = comparisonMonth?.ToString("MMM yyyy", CultureInfo.InvariantCulture),
                    Total = currentTotals.GetValueOrDefault(month, 0),
                    PreviousTotal = comparisonMonth is DateTime compared
                        ? previousTotals.GetValueOrDefault(compared, 0)
                        : 0
                };
            })
            .ToList();
    }

    private static List<DateTime> MonthStarts(DateTime from, DateTime toExclusive)
    {
        var cursor = new DateTime(from.Year, from.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var end = new DateTime(toExclusive.Year, toExclusive.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var months = new List<DateTime>();

        while (cursor < end)
        {
            months.Add(cursor);
            cursor = cursor.AddMonths(1);
        }

        return months;
    }

    private static Dictionary<int, decimal> TotalsByDay(
        IEnumerable<Transaction> transactions,
        Func<Transaction, decimal> amountOf) =>
        transactions
            .GroupBy(transaction => transaction.Date.Day)
            .ToDictionary(group => group.Key, group => group.Sum(amountOf));

    private static Dictionary<DateTime, decimal> TotalsByMonth(
        IEnumerable<Transaction> transactions,
        Func<Transaction, decimal> amountOf) =>
        transactions
            .GroupBy(transaction => new DateTime(transaction.Date.Year, transaction.Date.Month, 1, 0, 0, 0, DateTimeKind.Utc))
            .ToDictionary(group => group.Key, group => group.Sum(amountOf));
}
