using System.ComponentModel.DataAnnotations.Schema;
using System.Text.RegularExpressions;
using System.Text.Json.Serialization;
using KeepItSimple.Api.dtos.Category;
using KeepItSimple.Api.Helpers;
using Microsoft.EntityFrameworkCore;

namespace KeepItSimple.Api.Models;

public partial class Category
{
    public const string CustomGroup = "Custom";
    private const int NameMaxLength = 40;
    private const int IconMaxLength = 40;

    public int Id { get; set; }

    // Null for system categories (shared, locked). Never sent to or read from the client.
    [JsonIgnore]
    public string? UserId { get; set; }

    // Enum name of a system category; null for custom ones.
    public string? Key { get; set; }
    public string Name { get; set; } = string.Empty;

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public CategoryKind Kind { get; set; }

    public string Group { get; set; } = CustomGroup;

    // Lucide icon component name, e.g. "Utensils".
    public string Icon { get; set; } = string.Empty;

    // Hex color, e.g. "#8B5E3C".
    public string Color { get; set; } = string.Empty;

    [NotMapped]
    public bool IsSystem => UserId is null;

    // Legacy JSON: the enum name of a system id, "Other" for custom ids. Removed with the legacy fields.
    public static string LegacyKey(int categoryId)
    {
        return Enum.IsDefined(typeof(Transaction.TransactionCategory), categoryId)
            ? ((Transaction.TransactionCategory)categoryId).ToString()
            : nameof(Transaction.TransactionCategory.Other);
    }

    public static int LegacyId(string? key, int currentId)
    {
        if (currentId != 0 || string.IsNullOrWhiteSpace(key))
        {
            return currentId;
        }

        // An unknown name maps to -1 so the visibility check rejects it with 400.
        return Enum.TryParse<Transaction.TransactionCategory>(key, ignoreCase: true, out var parsed) ? (int)parsed : -1;
    }

    public static Task<List<Category>> GetVisibleAsync(string userId)
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
            await dbContext.Categories
                .AsNoTracking()
                .Where(c => c.UserId == null || c.UserId == userId)
                .OrderBy(c => c.Id)
                .ToListAsync());
    }

    public static Task<Category?> GetByIdAsync(int id, string userId)
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
            await dbContext.Categories.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId));
    }

    public static Task<bool> IsVisibleAsync(int id, string userId)
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(dbContext => IsVisibleAsync(dbContext, id, userId));
    }

    public static Task<bool> IsVisibleAsync(KeepItSimpleDbContext dbContext, int id, string userId)
    {
        return dbContext.Categories.AnyAsync(c => c.Id == id && (c.UserId == null || c.UserId == userId));
    }

    public static Task<Category> CreateAsync(Category category, string userId)
    {
        category.Normalize();
        category.Validate();

        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            await EnsureUniqueNameAsync(dbContext, category, userId);
            category.Id = 0;
            category.UserId = userId;
            category.Key = null;
            category.Group = CustomGroup;
            dbContext.Categories.Add(category);
            await dbContext.SaveChangesAsync();
            return category;
        });
    }

    public static Task<Category?> UpdateAsync(Category category, string userId)
    {
        category.Normalize();
        category.Validate();

        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            var existing = await dbContext.Categories
                .FirstOrDefaultAsync(c => c.Id == category.Id && c.UserId == userId);
            if (existing is null)
            {
                return null;
            }

            await EnsureUniqueNameAsync(dbContext, category, userId);
            existing.Name = category.Name;
            existing.Kind = category.Kind;
            existing.Icon = category.Icon;
            existing.Color = category.Color;
            await dbContext.SaveChangesAsync();
            return existing;
        });
    }

    // Custom categories only. Its transactions move to Other; the rules that target it are disabled and re-pointed to Other.
    public static Task<bool> DeleteAsync(int id, string userId)
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            var existing = await dbContext.Categories
                .FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
            if (existing is null)
            {
                return false;
            }

            var transactions = await dbContext.Transactions
                .Where(t => t.CategoryId == id && t.Pocket!.UserId == userId)
                .ToListAsync();
            foreach (var transaction in transactions)
            {
                transaction.CategoryId = (int)Transaction.TransactionCategory.Other;
            }

            var rules = await dbContext.CategoryRules
                .Where(r => r.TargetCategoryId == id && r.UserId == userId)
                .ToListAsync();
            foreach (var rule in rules)
            {
                // The FK is Restrict, so a disabled rule must stop pointing at the deleted row.
                rule.Enabled = false;
                rule.TargetCategoryId = (int)Transaction.TransactionCategory.Other;
            }

            dbContext.Categories.Remove(existing);
            await dbContext.SaveChangesAsync();
            return true;
        });
    }

    public static Task<CategoryUsageResponse?> GetUsageAsync(int id, string userId)
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            if (!await dbContext.Categories.AnyAsync(c => c.Id == id && c.UserId == userId))
            {
                return null;
            }

            return new CategoryUsageResponse
            {
                Transactions = await dbContext.Transactions
                    .CountAsync(t => t.CategoryId == id && t.Pocket!.UserId == userId),
                Rules = await dbContext.CategoryRules
                    .CountAsync(r => r.TargetCategoryId == id && r.UserId == userId),
            };
        });
    }

    public void Normalize()
    {
        Name = (Name ?? string.Empty).Trim();
        Icon = (Icon ?? string.Empty).Trim();
        Color = (Color ?? string.Empty).Trim();
    }

    public void Validate()
    {
        if (Name.Length is 0 or > NameMaxLength)
        {
            throw new ArgumentException($"A category name must be 1 to {NameMaxLength} characters.");
        }

        if (!HexColor().IsMatch(Color))
        {
            throw new ArgumentException("A category color must be a hex value like #A1B2C3.");
        }

        if (Icon.Length is 0 or > IconMaxLength)
        {
            throw new ArgumentException($"A category icon must be 1 to {IconMaxLength} characters.");
        }

        if (Kind is not (CategoryKind.Expense or CategoryKind.Income))
        {
            throw new ArgumentException("A custom category must be an Expense or an Income.");
        }
    }

    // Checked in code: the InMemory test database does not enforce unique indexes.
    // shortcut: check-then-insert can race on two concurrent creates; add a unique index on (UserId, lower(Name)) if that shows up.
    private static async Task EnsureUniqueNameAsync(KeepItSimpleDbContext dbContext, Category category, string userId)
    {
        var names = await dbContext.Categories
            .Where(c => (c.UserId == null || c.UserId == userId) && c.Id != category.Id)
            .Select(c => c.Name)
            .ToListAsync();
        if (names.Any(name => string.Equals(name, category.Name, StringComparison.OrdinalIgnoreCase)))
        {
            throw new ArgumentException($"A category named '{category.Name}' already exists.");
        }
    }

    [GeneratedRegex("^#[0-9A-Fa-f]{6}$")]
    private static partial Regex HexColor();
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum CategoryKind
{
    Expense,
    Income,
    Saving,
    Transfer,
}
