using KeepItSimple.Api.dtos.Transaction;
using KeepItSimple.Api.Models;

namespace KeepItSimple.Api.Helpers;

public static class TransactionQuery
{
    public const int DefaultPageSize = 10;
    public const int MaxPageSize = 100;

    public static PagedTransactionsResponse Apply(
        IQueryable<Transaction> source,
        TransactionListQuery query)
    {
        var page = Math.Max(query.Page, 1);
        var pageSize = query.PageSize <= 0
            ? DefaultPageSize
            : Math.Clamp(query.PageSize, 1, MaxPageSize);

        var filtered = Filter(source, query)
            .OrderByDescending(transaction => transaction.Date)
            .ThenByDescending(transaction => transaction.Id);

        var totalCount = filtered.Count();
        var items = filtered
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return new PagedTransactionsResponse
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
        };
    }

    public static IQueryable<Transaction> Filter(
        IQueryable<Transaction> source,
        TransactionListQuery query)
    {
        var filtered = source;

        if (query.PocketId is int pocketId)
        {
            filtered = filtered.Where(transaction => transaction.PocketId == pocketId);
        }

        if (query.Category is Transaction.TransactionCategory category)
        {
            filtered = filtered.Where(transaction => transaction.Category == category);
        }

        if (query.From is DateTime from)
        {
            var fromUtc = StartOfDayUtc(from);
            filtered = filtered.Where(transaction => transaction.Date >= fromUtc);
        }

        if (query.To is DateTime to)
        {
            var toExclusiveUtc = StartOfNextDayUtc(to);
            filtered = filtered.Where(transaction => transaction.Date < toExclusiveUtc);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim().ToLower();
            filtered = filtered.Where(transaction =>
                transaction.Description != null
                && transaction.Description.ToLower().Contains(term));
        }

        return filtered;
    }

    private static DateTime StartOfDayUtc(DateTime date)
    {
        return DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);
    }

    private static DateTime StartOfNextDayUtc(DateTime date)
    {
        return DateTime.SpecifyKind(date.Date.AddDays(1), DateTimeKind.Utc);
    }
}
