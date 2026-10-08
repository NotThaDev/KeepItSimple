
using System.Text.Json;
using KeepItSimple.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace KeepItSimple.Api.Helpers;

public class KeepItSimpleDbContext(DbContextOptions<KeepItSimpleDbContext> options) : IdentityDbContext<KeepItSimpleUser>(options)
{
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<Pocket> Pockets => Set<Pocket>();
    public DbSet<CategoryRule> CategoryRules => Set<CategoryRule>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        UseIdentitySchema(modelBuilder);

        modelBuilder.Entity<Transaction>()
            .HasOne(transaction => transaction.Pocket)
            .WithMany(pocket => pocket.Transactions)
            .HasForeignKey(transaction => transaction.PocketId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<CategoryRule>(entity =>
        {
            entity.Property(rule => rule.Name).IsRequired();
            entity.Property(rule => rule.Groups)
                .HasColumnType("jsonb")
                .HasConversion(
                    groups => JsonSerializer.Serialize(groups, CategoryRuleJson.Options),
                    json => JsonSerializer.Deserialize<List<CategoryRuleGroup>>(json, CategoryRuleJson.Options)
                        ?? new List<CategoryRuleGroup>())
                .Metadata.SetValueComparer(new ValueComparer<List<CategoryRuleGroup>>(
                    (left, right) => JsonSerializer.Serialize(left, CategoryRuleJson.Options)
                        == JsonSerializer.Serialize(right, CategoryRuleJson.Options),
                    groups => JsonSerializer.Serialize(groups, CategoryRuleJson.Options).GetHashCode(),
                    groups => JsonSerializer.Deserialize<List<CategoryRuleGroup>>(
                        JsonSerializer.Serialize(groups, CategoryRuleJson.Options),
                        CategoryRuleJson.Options) ?? new List<CategoryRuleGroup>()));
        });
    }

    private static void UseIdentitySchema(ModelBuilder modelBuilder)
    {
        var identityAssembly = typeof(IdentityUser).Assembly;
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (entityType.ClrType.Assembly == identityAssembly || entityType.ClrType == typeof(KeepItSimpleUser))
            {
                entityType.SetSchema("identity");
            }
        }
    }

}