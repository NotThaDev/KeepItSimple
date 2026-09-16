using KeepItSimple.Api.Dtos;
using KeepItSimple.Api.Helpers;
using KeepItSimple.Api.Models;

namespace KeepItSimple.Api.Tests.TransactionList;

public class TransactionQueryTests
{
    [Fact]
    public void Apply_filters_by_pocket()
    {
        var result = TransactionQuery.Apply(SampleTransactions(), new TransactionListQuery
        {
            PocketId = 2,
            From = null,
            To = null,
        });

        Assert.Equal(2, result.TotalCount);
        Assert.All(result.Items, transaction => Assert.Equal(2, transaction.PocketId));
    }

    [Fact]
    public void Apply_filters_by_category()
    {
        var result = TransactionQuery.Apply(SampleTransactions(), new TransactionListQuery
        {
            Category = Transaction.TransactionCategory.Food,
            From = null,
            To = null,
        });

        Assert.Equal(2, result.TotalCount);
        Assert.All(result.Items, transaction =>
            Assert.Equal(Transaction.TransactionCategory.Food, transaction.Category));
    }

    [Fact]
    public void Apply_filters_by_inclusive_date_range()
    {
        var result = TransactionQuery.Apply(SampleTransactions(), new TransactionListQuery
        {
            From = new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc),
            To = new DateTime(2026, 9, 30, 0, 0, 0, DateTimeKind.Utc),
        });

        Assert.Equal(3, result.TotalCount);
        Assert.Equal(
            ["Lunch", "Groceries", "Coffee"],
            result.Items.Select(transaction => transaction.Description));
    }

    [Fact]
    public void Apply_includes_transactions_on_the_last_day_of_the_range()
    {
        var result = TransactionQuery.Apply(SampleTransactions(), new TransactionListQuery
        {
            From = new DateTime(2026, 9, 30, 0, 0, 0, DateTimeKind.Utc),
            To = new DateTime(2026, 9, 30, 0, 0, 0, DateTimeKind.Utc),
        });

        Assert.Equal(["Lunch"], result.Items.Select(transaction => transaction.Description));
    }

    [Fact]
    public void Apply_searches_description_case_insensitively()
    {
        var result = TransactionQuery.Apply(SampleTransactions(), new TransactionListQuery
        {
            Search = "COFF",
            From = null,
            To = null,
        });

        Assert.Equal(["Coffee"], result.Items.Select(transaction => transaction.Description));
    }

    [Fact]
    public void Apply_ignores_blank_search()
    {
        var result = TransactionQuery.Apply(SampleTransactions(), new TransactionListQuery
        {
            Search = "   ",
            From = null,
            To = null,
        });

        Assert.Equal(5, result.TotalCount);
    }

    [Fact]
    public void Apply_paginates_newest_first()
    {
        var result = TransactionQuery.Apply(SampleTransactions(), new TransactionListQuery
        {
            Page = 2,
            PageSize = 2,
            From = null,
            To = null,
        });

        Assert.Equal(5, result.TotalCount);
        Assert.Equal(2, result.Page);
        Assert.Equal(2, result.PageSize);
        Assert.Equal(
            ["Groceries", "Coffee"],
            result.Items.Select(transaction => transaction.Description));
    }

    [Fact]
    public void Apply_clamps_page_and_page_size()
    {
        var result = TransactionQuery.Apply(SampleTransactions(), new TransactionListQuery
        {
            Page = 0,
            PageSize = 1000,
            From = null,
            To = null,
        });

        Assert.Equal(1, result.Page);
        Assert.Equal(TransactionQuery.MaxPageSize, result.PageSize);
        Assert.Equal(5, result.Items.Count);
    }

    [Fact]
    public void Apply_combines_filters_before_paginating()
    {
        var result = TransactionQuery.Apply(SampleTransactions(), new TransactionListQuery
        {
            PocketId = 1,
            Category = Transaction.TransactionCategory.Food,
            Search = "lunch",
            From = new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc),
            To = new DateTime(2026, 9, 30, 0, 0, 0, DateTimeKind.Utc),
            Page = 1,
            PageSize = 10,
        });

        Assert.Equal(["Lunch"], result.Items.Select(transaction => transaction.Description));
        Assert.Equal(1, result.TotalCount);
    }

    private static IQueryable<Transaction> SampleTransactions()
    {
        return new List<Transaction>
        {
            TransactionAt(1, 1, Transaction.TransactionCategory.Coffe, "Coffee", 2026, 9, 10),
            TransactionAt(2, 1, Transaction.TransactionCategory.Food, "Lunch", 2026, 9, 30, 15),
            TransactionAt(3, 2, Transaction.TransactionCategory.Food, "Groceries", 2026, 9, 15),
            TransactionAt(4, 2, Transaction.TransactionCategory.Transport, "Train", 2026, 8, 31),
            TransactionAt(5, 1, Transaction.TransactionCategory.Salary, "September salary", 2026, 10, 1),
        }.AsQueryable();
    }

    private static Transaction TransactionAt(
        int id,
        int pocketId,
        Transaction.TransactionCategory category,
        string description,
        int year,
        int month,
        int day,
        int hour = 0)
    {
        return new Transaction
        {
            Id = id,
            PocketId = pocketId,
            Category = category,
            Description = description,
            Amount = -10m,
            Date = new DateTime(year, month, day, hour, 0, 0, DateTimeKind.Utc),
        };
    }
}
