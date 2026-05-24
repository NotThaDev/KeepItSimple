
using KeepItSimple.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace KeepItSimple.Api.Helpers;

public class KeepItSimpleDbContext(DbContextOptions<KeepItSimpleDbContext> options) : DbContext(options)
{
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<Pocket> Pockets => Set<Pocket>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Transaction>()
            .HasOne(transaction => transaction.Pocket)
            .WithMany(pocket => pocket.Transactions)
            .HasForeignKey(transaction => transaction.PocketId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Restrict);
    }

}