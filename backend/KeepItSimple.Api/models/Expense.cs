using KeepItSimple.Api.Helpers;
using Microsoft.EntityFrameworkCore;

namespace KeepItSimple.Api.Models;

public class Expense
{
    public int? Id { get; set; }
    public string? Description { get; set; }
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    public ExpenseCategory Category { get; set; }

    public static Task<List<Expense>> GetAllAsync()
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            return await dbContext.Expenses.ToListAsync();
        });
    }

    public static Task<Expense?> GetByIdAsync(int id)
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            var expense = await dbContext.Expenses.FindAsync(id);
            return expense;
        });
    }

    public static Task<Expense?> Update(Expense expense)
    {
        if (!expense.Id.HasValue)
        {
            // Create
            return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
            {
                dbContext.Expenses.Add(expense);
                await dbContext.SaveChangesAsync();
                return (Expense?)expense;
            });
        }

        // Update
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            var existingExpense = await dbContext.Expenses.FindAsync(expense.Id);
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
            var expense = await dbContext.Expenses.FindAsync(id);
            if (expense is null)
            {
                return false;
            }
            dbContext.Expenses.Remove(expense);
            await dbContext.SaveChangesAsync();
            return true;
        });
    }


    public enum ExpenseCategory
    {
        Coffee,
        Food,
        Transportation,
        Entertainment,
        Utilities,
        Other
    }
}