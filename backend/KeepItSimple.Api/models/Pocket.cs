using System.Text.Json.Serialization;
using KeepItSimple.Api.Helpers;
using Microsoft.EntityFrameworkCore;

namespace KeepItSimple.Api.Models;

public class Pocket
{
    public int Id { get; set; }
    public decimal Balance { get; set; }
    public string Currency { get; set; } = "EUR";
    public string Name { get; set; } = string.Empty;

    // Owner; never sent to or read from the client.
    [JsonIgnore]
    public string UserId { get; set; } = string.Empty;
    public ICollection<Transaction> Transactions { get; set; } = [];

    public static Task<List<Pocket>> GetAllAsync(string userId)
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            return await dbContext.Pockets.Where(p => p.UserId == userId).OrderBy(p => p.Id).ToListAsync();
        });
    }

    public static Task<Pocket?> GetByIdAsync(int id, string userId)
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            var pocket = await dbContext.Pockets.FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);
            return pocket;
        });
    }

    public static Task<Pocket?> Update(Pocket pocket, string userId)
    {
        if (pocket.Id == 0)
        {
            // Create
            return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
            {
                pocket.UserId = userId;
                dbContext.Pockets.Add(pocket);
                await dbContext.SaveChangesAsync();
                return (Pocket?)pocket;
            });
        }

        // Update
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            var existingPocket = await dbContext.Pockets.FirstOrDefaultAsync(p => p.Id == pocket.Id && p.UserId == userId);
            if (existingPocket == null)
            {
                return null;
            }

            existingPocket.Balance = pocket.Balance;
            existingPocket.Currency = pocket.Currency;
            existingPocket.Name = pocket.Name;

            await dbContext.SaveChangesAsync();
            return existingPocket;
        });
    }

    public static Task<bool> Delete(int id, string userId)
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            var pocket = await dbContext.Pockets.FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);
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
