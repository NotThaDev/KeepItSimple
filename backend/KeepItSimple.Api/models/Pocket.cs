using KeepItSimple.Api.Helpers;
using Microsoft.EntityFrameworkCore;

namespace KeepItSimple.Api.Models;

public class Pocket
{
    public int Id { get; set; }
    public decimal Balance { get; set; }
    public string Currency { get; set; } = "EUR";
    public string Name { get; set; } = string.Empty;
    public string Iban { get; set; } = string.Empty;
    public ICollection<Transaction> Transactions { get; set; } = [];

    public static Task<List<Pocket>> GetAllAsync()
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            return await dbContext.Pockets.OrderBy(p => p.Id).ToListAsync();
        });
    }

    public static Task<Pocket?> GetByIdAsync(int id)
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            var pocket = await dbContext.Pockets.FindAsync(id);
            return pocket;
        });
    }

    public static Task<Pocket?> Update(Pocket pocket)
    {
        if (pocket.Id == 0)
        {
            // Create
            return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
            {
                dbContext.Pockets.Add(pocket);
                await dbContext.SaveChangesAsync();
                return (Pocket?)pocket;
            });
        }

        // Update
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            var existingPocket = await dbContext.Pockets.FindAsync(pocket.Id);
            if (existingPocket == null)
            {
                return null;
            }

            existingPocket.Balance = pocket.Balance;
            existingPocket.Currency = pocket.Currency;
            existingPocket.Name = pocket.Name;
            existingPocket.Iban = pocket.Iban;

            await dbContext.SaveChangesAsync();
            return existingPocket;
        });
    }

    public static Task<bool> Delete(int id)
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            var pocket = await dbContext.Pockets.FindAsync(id);
            if (pocket == null)
            {
                return false;
            }

            var associatedTransactions = await dbContext.Transactions
                .Where(transaction => transaction.PocketId == id)
                .ToListAsync();

            if (associatedTransactions.Count > 0)
            {
                dbContext.Transactions.RemoveRange(associatedTransactions);
            }

            dbContext.Pockets.Remove(pocket);
            await dbContext.SaveChangesAsync();
            return true;
        });
    }
}