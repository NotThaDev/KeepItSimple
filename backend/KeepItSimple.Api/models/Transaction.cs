using System.Text.Json.Serialization;
using KeepItSimple.Api.dtos.Transaction;
using KeepItSimple.Api.Helpers;
using Microsoft.EntityFrameworkCore;

namespace KeepItSimple.Api.Models;

public class Transaction
{
    public int? Id { get; set; }
    public string? Description { get; set; }
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public TransactionCategory Category { get; set; }
    public int PocketId { get; set; }
    [JsonIgnore]
    public Pocket? Pocket { get; set; }

    public static Task<List<Transaction>> GetAllAsync()
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext => await dbContext.Transactions.OrderByDescending(t => t.Date).ToListAsync());
    }

    public static Task<PagedTransactionsResponse> GetPagedAsync(TransactionListQuery query)
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(dbContext =>
        {
            var result = TransactionQuery.Apply(dbContext.Transactions.AsNoTracking(), query);
            return Task.FromResult(result);
        });
    }

    public static Task<List<Transaction>> GetByPocketIdAsync(int pocketId)
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext => await dbContext.Transactions.Where(t => t.PocketId == pocketId).OrderByDescending(t => t.Date).ToListAsync());
    }

    public static Task<Transaction?> GetByIdAsync(int id)
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            var expense = await dbContext.Transactions.FindAsync(id);
            return expense;
        });
    }

    public static Task<Transaction?> Update(Transaction expense)
    {
        if (!expense.Id.HasValue)
        {
            // Create
            return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
            {
                var pocketId = expense.PocketId;
                var pocket = await dbContext.Pockets.FindAsync(pocketId);
                if (pocket == null)
                {
                    return null;
                }

                pocket.Balance += expense.Amount;

                expense.PocketId = pocket.Id;
                expense.Pocket = pocket;

                dbContext.Transactions.Add(expense);
                await dbContext.SaveChangesAsync();
                return (Transaction?)expense;
            });
        }

        // Update
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            var existingExpense = await dbContext.Transactions.FindAsync(expense.Id);
            if (existingExpense == null)
            {
                return null;
            }

            var currentPocketId = existingExpense.PocketId;
            var targetPocketId = expense.PocketId > 0 ? expense.PocketId : currentPocketId;
            var previousAmount = existingExpense.Amount;
            var newAmount = expense.Amount;

            if (targetPocketId == currentPocketId)
            {
                var pocket = await dbContext.Pockets.FindAsync(currentPocketId);
                if (pocket == null)
                {
                    return null;
                }

                // Apply the signed delta: negative values behave as expenses, positive as income.
                pocket.Balance += newAmount - previousAmount;
            }
            else
            {
                var previousPocket = await dbContext.Pockets.FindAsync(currentPocketId);
                var newPocket = await dbContext.Pockets.FindAsync(targetPocketId);
                if (previousPocket == null || newPocket == null)
                {
                    return null;
                }

                previousPocket.Balance -= previousAmount;
                newPocket.Balance += newAmount;

                existingExpense.Pocket = newPocket;
                existingExpense.PocketId = newPocket.Id;
            }

            existingExpense.Description = expense.Description;
            existingExpense.Amount = expense.Amount;
            existingExpense.Date = expense.Date;
            existingExpense.Category = expense.Category;

            await dbContext.SaveChangesAsync();
            return existingExpense;
        });

    }

    public static Task<bool> Delete(List<int> ids)
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            // First, verify that all expenses exist
            foreach (var id in ids)
            {
                var expense = await dbContext.Transactions.FindAsync(id);
                if (expense is null)
                {
                    return false;
                }
            }

            // If all expenses exist, proceed with deletion
            foreach (var id in ids)
            {
                var expense = await dbContext.Transactions.FindAsync(id);

                // We are already checking that the expense exists, but just in case.
                if (expense is null)
                {
                    continue;
                }

                var pocket = await dbContext.Pockets.FindAsync(expense.PocketId);
                // Revert the transaction: subtract the signed amount (negative for expenses, positive for income).
                pocket?.Balance -= expense.Amount;

                dbContext.Transactions.Remove(expense);
            }

            await dbContext.SaveChangesAsync();
            return true;
        });
    }

    public static Task<(Transaction Outgoing, Transaction Incoming)?> CreateTransfer(
        int fromPocketId,
        int toPocketId,
        decimal amount,
        DateTime date,
        string? description)
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            var transferAmount = Math.Abs(amount);
            if (fromPocketId == toPocketId || transferAmount <= 0)
            {
                return ((Transaction, Transaction)?)null;
            }

            var fromPocket = await dbContext.Pockets.FindAsync(fromPocketId);
            var toPocket = await dbContext.Pockets.FindAsync(toPocketId);
            if (fromPocket == null || toPocket == null)
            {
                return null;
            }

            var outgoing = new Transaction
            {
                Amount = -transferAmount,
                Category = TransactionCategory.Transfer,
                Date = date,
                Description = description,
                PocketId = fromPocket.Id,
                Pocket = fromPocket,
            };
            var incoming = new Transaction
            {
                Amount = transferAmount,
                Category = TransactionCategory.Transfer,
                Date = date,
                Description = description,
                PocketId = toPocket.Id,
                Pocket = toPocket,
            };

            fromPocket.Balance += outgoing.Amount;
            toPocket.Balance += incoming.Amount;

            dbContext.Transactions.Add(outgoing);
            dbContext.Transactions.Add(incoming);
            await dbContext.SaveChangesAsync();

            return (outgoing, incoming);
        });
    }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum TransactionCategory
    {
        Coffe,
        Food,
        Transport,
        Entertainment,
        Utilities,
        Shopping,
        Health,
        Education,
        Travel,
        Sports,
        Subscriptions,
        Savings,
        Investments,
        Gifts,
        Love,
        Charity,
        Salary,
        Bonus,
        Freelance,
        Business,
        Interest,
        Dividends,
        RentalIncome,
        Refund,
        Other,
        Car,
        Clothing,
        Accessories,
        Furniture,
        Home,
        Newsstand,
        Events,
        Computers,
        Hotel,
        School,
        Books,
        Motorcycle,
        Music,
        Gym,
        Hairdresser,
        Personal,
        Repairs,
        Relationships,
        Services,
        Special,
        Groceries,
        Sport,
        Leisure,
        Taxes,
        Phone,
        Film,
        Insurance,
        Lease,
        Rent,
        Mortgage,
        Loan,
        Transfer,
        Withdraw,
    }
}