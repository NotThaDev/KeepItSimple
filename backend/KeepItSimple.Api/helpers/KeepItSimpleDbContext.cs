
using System.Text.Json;
using KeepItSimple.Api.Models;
using KeepItSimple.Api.Models.Auth;
using KeepItSimple.Api.Models.Notifications;
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
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<ProfilePicture> ProfilePictures => Set<ProfilePicture>();

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

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasIndex(token => token.TokenHash).IsUnique();
            entity.HasIndex(token => token.UserId);
            entity.HasIndex(token => token.SessionId);
            entity.HasOne<KeepItSimpleUser>()
                .WithMany()
                .HasForeignKey(token => token.UserId)
                .IsRequired()
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ProfilePicture>(entity =>
        {
            entity.HasKey(picture => picture.UserId);
            entity.Property(picture => picture.ContentType).HasMaxLength(32).IsRequired();
            entity.HasOne<KeepItSimpleUser>()
                .WithOne()
                .HasForeignKey<ProfilePicture>(picture => picture.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasIndex(notification => new { notification.Status, notification.NextAttemptAt });
            entity.HasIndex(notification => notification.UserId);
            entity.HasOne<KeepItSimpleUser>()
                .WithMany()
                .HasForeignKey(notification => notification.UserId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Cascade);
            entity.Property(notification => notification.Recipient).IsRequired();
            entity.Property(notification => notification.Subject).IsRequired();
            entity.Property(notification => notification.Body).IsRequired();
        });

        modelBuilder.Entity<Pocket>(entity =>
        {
            entity.HasIndex(pocket => pocket.UserId);
            entity.HasOne<KeepItSimpleUser>()
                .WithMany()
                .HasForeignKey(pocket => pocket.UserId)
                .IsRequired()
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<CategoryRule>(entity =>
        {
            entity.HasIndex(rule => rule.UserId);
            entity.HasOne<KeepItSimpleUser>()
                .WithMany()
                .HasForeignKey(rule => rule.UserId)
                .IsRequired()
                .OnDelete(DeleteBehavior.Restrict);
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
            if (entityType.ClrType.Assembly == identityAssembly || entityType.ClrType == typeof(KeepItSimpleUser) || entityType.ClrType == typeof(RefreshToken))
            {
                entityType.SetSchema("identity");
            }
        }
    }

}