using System.Text.Json.Serialization;
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

    public static Task<List<Transaction>> GetAllAsync()
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            return await dbContext.Transactions.ToListAsync();
        });
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

            existingExpense.Description = expense.Description;
            existingExpense.Amount = expense.Amount;
            existingExpense.Date = expense.Date;
            existingExpense.Category = expense.Category;

            await dbContext.SaveChangesAsync();
            return existingExpense;
        });

    }

    public static Task<bool> Delete(int id)
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            var expense = await dbContext.Transactions.FindAsync(id);
            if (expense is null)
            {
                return false;
            }
            dbContext.Transactions.Remove(expense);
            await dbContext.SaveChangesAsync();
            return true;
        });
    }


    public enum TransactionCategory
    {
        Coffe,
        Food,
        Transport,
        Entertainment,
        Utilities,
        Other
    }
}