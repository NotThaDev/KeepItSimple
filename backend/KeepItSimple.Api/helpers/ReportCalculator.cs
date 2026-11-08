using System.Globalization;
using KeepItSimple.Api.Models;
using KeepItSimple.Api.Models.Analytics;
using KeepItSimple.Api.Models.Reports;
using static KeepItSimple.Api.Models.Transaction;

namespace KeepItSimple.Api.Helpers;

/// <summary>Pure report maths: no database, no clock.</summary>
public static class ReportCalculator
{
    private const string NoDescription = "(no description)";
    private const int MaxTransferNotes = 15;
    private const int TransferMatchDays = 3;

    public static ReportData Calculate(
        IReadOnlyCollection<Transaction> transactions,
        IReadOnlyCollection<Pocket> pockets,
        ReportPeriodRange range,
        DateTime generatedAt)
    {
        var names = pockets.ToDictionary(p => p.Id, p => p.Name);
        var currency = pockets.FirstOrDefault()?.Currency ?? "EUR";
        var counterparts = MatchTransfers(transactions);

        var total = BuildScope("Total", currency, transactions, pockets.Sum(p => p.Balance), range, names, counterparts);
        var perPocket = pockets
            .OrderBy(p => p.Name, StringComparer.OrdinalIgnoreCase)
            .Select(p => BuildScope(p.Name, p.Currency, transactions.Where(t => t.PocketId == p.Id).ToList(), p.Balance, range, names, counterparts))
            .ToList();

        var rows = transactions
            .Where(t => t.Date >= range.Start && t.Date < range.End)
            .OrderBy(t => t.Date)
            .Select(t => ToRow(t, names))
            .ToList();

        return new ReportData(range, generatedAt, currency, total, perPocket, rows);
    }

    private static ReportScope BuildScope(
        string name,
        string currency,
        IReadOnlyCollection<Transaction> all,
        decimal balance,
        ReportPeriodRange range,
        Dictionary<int, string> names,
        Dictionary<Transaction, Transaction> counterparts)
    {
        var current = InRange(all, range.Start, range.End);
        var previous = InRange(all, range.PreviousStart, range.PreviousEnd);
        var currentKpis = BuildKpis(all, current, balance, range.Start, range.End, names);
        var previousKpis = BuildKpis(all, previous, balance, range.PreviousStart, range.PreviousEnd, names);

        var topExpenses = current
            .Where(Analytics.IsExpense)
            .OrderBy(t => t.Amount)
            .Take(10)
            .Select(t => ToRow(t, names))
            .ToList();

        var topDescriptions = current
            .Where(Analytics.IsExpense)
            .GroupBy(t => Describe(t), StringComparer.OrdinalIgnoreCase)
            .Select(g => new ReportDescriptionRow(g.Key, g.Count(), -g.Sum(t => t.Amount)))
            .OrderByDescending(d => d.Total)
            .Take(10)
            .ToList();

        return new ReportScope(
            name,
            currency,
            currentKpis,
            previousKpis,
            BuildTrend(current, range, currentKpis.OpeningBalance, currency, names, counterparts, [.. all.Select(t => t.PocketId)]),
            BuildCategories(current.Where(Analytics.IsExpense), previous.Where(Analytics.IsExpense), -1),
            BuildCategories(current.Where(Analytics.IsIncome), previous.Where(Analytics.IsIncome), 1),
            topExpenses,
            topDescriptions);
    }

    private static List<Transaction> InRange(IEnumerable<Transaction> transactions, DateTime start, DateTime end) =>
        [.. transactions.Where(t => t.Date >= start && t.Date < end)];

    private static ReportKpis BuildKpis(
        IReadOnlyCollection<Transaction> all,
        List<Transaction> inRange,
        decimal balance,
        DateTime start,
        DateTime end,
        Dictionary<int, string> names)
    {
        var income = inRange.Where(Analytics.IsIncome).Sum(t => t.Amount);
        var expenses = -inRange.Where(Analytics.IsExpense).Sum(t => t.Amount);
        var net = income - expenses;
        var saved = Moved(inRange, TransactionCategory.Savings);
        var invested = Moved(inRange, TransactionCategory.Investments);
        var days = Math.Max(1, (end - start).Days);
        var largest = inRange.Where(Analytics.IsExpense).OrderBy(t => t.Amount).FirstOrDefault();
        var closing = balance - all.Where(t => t.Date >= end).Sum(t => t.Amount);
        var opening = closing - inRange.Sum(t => t.Amount);

        return new ReportKpis(
            income,
            expenses,
            net,
            income == 0 ? 0 : net / income,
            saved,
            invested,
            expenses / days,
            inRange.Count,
            largest is null ? null : ToRow(largest, names),
            opening,
            closing);
    }

    private static List<ReportTrendBucket> BuildTrend(
        List<Transaction> current,
        ReportPeriodRange range,
        decimal opening,
        string currency,
        Dictionary<int, string> names,
        Dictionary<Transaction, Transaction> counterparts,
        HashSet<int> scopePockets)
    {
        var daily = range.Period == ReportPeriod.LastMonth;
        var buckets = new List<ReportTrendBucket>();
        decimal cumulativeNet = 0;
        var running = opening;

        for (var start = range.Start; start < range.End;)
        {
            var next = daily ? start.AddDays(1) : start.AddMonths(1);
            var items = current.Where(t => t.Date >= start && t.Date < next).ToList();
            var income = items.Where(Analytics.IsIncome).Sum(t => t.Amount);
            var expenses = -items.Where(Analytics.IsExpense).Sum(t => t.Amount);
            var moves = items.Where(IsMove).ToList();
            var notes = TransferNotes(moves, currency, names, counterparts, scopePockets);
            cumulativeNet += income - expenses;
            running += items.Sum(t => t.Amount);
            var label = start.ToString(daily ? "dd MMM" : "MMM yyyy", CultureInfo.InvariantCulture);
            buckets.Add(new ReportTrendBucket(label, start, income, expenses, moves.Sum(t => t.Amount), notes, income - expenses, cumulativeNet, running));
            start = next;
        }

        return buckets;
    }

    private static bool IsMove(Transaction t) => !Analytics.IsIncome(t) && !Analytics.IsExpense(t);

    // Transactions carry no link to the other side of a transfer, so pair each move with the closest move
    // of the opposite amount in another pocket within a few days.
    // shortcut: amount + date matching can pair the wrong transactions when equal amounts move the same week; store a transfer id if that matters.
    private static Dictionary<Transaction, Transaction> MatchTransfers(IReadOnlyCollection<Transaction> transactions)
    {
        var pairs = new Dictionary<Transaction, Transaction>(ReferenceEqualityComparer.Instance);
        var moves = transactions.Where(IsMove).OrderBy(t => t.Date).ToList();
        foreach (var t in moves.Where(t => t.Amount < 0))
        {
            var match = moves
                .Where(u => u.Amount == -t.Amount && u.PocketId != t.PocketId && !pairs.ContainsKey(u)
                    && Math.Abs((u.Date - t.Date).TotalDays) <= TransferMatchDays)
                .OrderBy(u => Math.Abs((u.Date - t.Date).TotalDays))
                .FirstOrDefault();
            if (match is not null)
            {
                pairs[t] = match;
                pairs[match] = t;
            }
        }
        return pairs;
    }

    private static List<string> TransferNotes(
        List<Transaction> moves,
        string currency,
        Dictionary<int, string> names,
        Dictionary<Transaction, Transaction> counterparts,
        HashSet<int> scopePockets)
    {
        var multiPocket = scopePockets.Count > 1;
        var lines = new List<string>();
        foreach (var t in moves.OrderBy(t => t.Date))
        {
            var amount = t.Amount.ToString("+#,##0.00;-#,##0.00", CultureInfo.InvariantCulture) + " " + currency;
            var prefix = multiPocket ? names.GetValueOrDefault(t.PocketId, string.Empty) + ": " : string.Empty;
            if (counterparts.TryGetValue(t, out var other))
            {
                // Inside one scope a matched pair is a single move: show it once, from the sending side.
                if (t.Amount > 0 && scopePockets.Contains(other.PocketId))
                {
                    continue;
                }
                var direction = t.Amount < 0 ? "to" : "from";
                lines.Add($"{prefix}{amount} {direction} {names.GetValueOrDefault(other.PocketId, "another pocket")}");
            }
            else
            {
                var description = Describe(t);
                lines.Add($"{prefix}{amount} {t.Category}: {(description.Length > 40 ? description[..40] + "…" : description)}");
            }
        }
        return lines.Count <= MaxTransferNotes
            ? lines
            : [.. lines.Take(MaxTransferNotes), $"… and {lines.Count - MaxTransferNotes} more"];
    }

    // sign flips expenses (negative amounts) to positive.
    private static List<ReportCategoryRow> BuildCategories(IEnumerable<Transaction> current, IEnumerable<Transaction> previous, int sign)
    {
        var cur = current.GroupBy(t => t.Category).ToDictionary(g => g.Key, g => (Amount: sign * g.Sum(t => t.Amount), Count: g.Count()));
        var prev = previous.GroupBy(t => t.Category).ToDictionary(g => g.Key, g => sign * g.Sum(t => t.Amount));
        var total = cur.Values.Sum(v => v.Amount);

        return [.. cur.Keys.Union(prev.Keys)
            .Select(c =>
            {
                var (amount, count) = cur.GetValueOrDefault(c);
                var previousAmount = prev.GetValueOrDefault(c);
                return new ReportCategoryRow(
                    c.ToString(),
                    amount,
                    total == 0 ? 0 : amount / total,
                    count,
                    count == 0 ? 0 : amount / count,
                    previousAmount,
                    amount - previousAmount);
            })
            .OrderByDescending(r => r.Amount)
            .ThenBy(r => r.Category, StringComparer.Ordinal)];
    }

    // A move can be tagged on the sending side (negative), the receiving side (positive) or both;
    // the larger side is the amount moved, without double counting when both sides are tagged.
    private static decimal Moved(List<Transaction> inRange, TransactionCategory category)
    {
        var tagged = inRange.Where(t => t.Category == category).ToList();
        return Math.Max(tagged.Where(t => t.Amount > 0).Sum(t => t.Amount), -tagged.Where(t => t.Amount < 0).Sum(t => t.Amount));
    }

    private static bool IsSavings(Transaction t) =>
        t.Category is TransactionCategory.Savings or TransactionCategory.Investments;

    private static string Describe(Transaction t) =>
        string.IsNullOrWhiteSpace(t.Description) ? NoDescription : t.Description.Trim();

    private static ReportTransactionRow ToRow(Transaction t, Dictionary<int, string> names) =>
        new(t.Date, names.GetValueOrDefault(t.PocketId, string.Empty), t.Description ?? string.Empty, t.Category.ToString(), t.Amount, TypeOf(t));

    private static string TypeOf(Transaction t) =>
        Analytics.IsIncome(t) ? "Income"
        : Analytics.IsExpense(t) ? "Expense"
        : t.Category is TransactionCategory.Transfer or TransactionCategory.Withdraw ? "Transfer"
        : IsSavings(t) ? "Savings"
        : "Other";
}
