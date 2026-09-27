using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;
using KeepItSimple.Api.dtos.CategoryRule;
using KeepItSimple.Api.dtos.Transaction;
using KeepItSimple.Api.Helpers;
using Microsoft.EntityFrameworkCore;

namespace KeepItSimple.Api.Models;

public class CategoryRule
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool Enabled { get; set; } = true;
    public int SortOrder { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public Transaction.TransactionCategory TargetCategory { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public RuleLogic GroupLogic { get; set; } = RuleLogic.Or;

    public List<CategoryRuleGroup> Groups { get; set; } = [];

    public static Task<List<CategoryRule>> GetAllAsync()
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
            await dbContext.CategoryRules.OrderBy(rule => rule.SortOrder).ThenBy(rule => rule.Id).ToListAsync());
    }

    public static Task<List<CategoryRule>> GetEnabledOrderedAsync()
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
            await dbContext.CategoryRules
                .Where(rule => rule.Enabled)
                .OrderBy(rule => rule.SortOrder)
                .ThenBy(rule => rule.Id)
                .ToListAsync());
    }

    public static Task<CategoryRule?> GetByIdAsync(int id)
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
            await dbContext.CategoryRules.FindAsync(id));
    }

    public static Task<CategoryRule> CreateAsync(CategoryRule rule)
    {
        rule.Normalize();
        rule.Validate();

        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            var maxOrder = await dbContext.CategoryRules
                .Select(existing => (int?)existing.SortOrder)
                .MaxAsync();
            rule.Id = 0;
            rule.SortOrder = (maxOrder ?? -1) + 1;
            dbContext.CategoryRules.Add(rule);
            await dbContext.SaveChangesAsync();
            return rule;
        });
    }

    public static Task<CategoryRule?> UpdateAsync(CategoryRule rule)
    {
        rule.Normalize();
        rule.Validate();

        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            var existing = await dbContext.CategoryRules.FindAsync(rule.Id);
            if (existing is null)
            {
                return null;
            }

            existing.Name = rule.Name;
            existing.Enabled = rule.Enabled;
            existing.TargetCategory = rule.TargetCategory;
            existing.GroupLogic = rule.GroupLogic;
            existing.Groups = rule.Groups;
            await dbContext.SaveChangesAsync();
            return existing;
        });
    }

    public static Task<bool> DeleteAsync(int id)
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            var existing = await dbContext.CategoryRules.FindAsync(id);
            if (existing is null)
            {
                return false;
            }

            dbContext.CategoryRules.Remove(existing);
            await dbContext.SaveChangesAsync();
            return true;
        });
    }

    public static Task ReorderAsync(IReadOnlyList<int> ids)
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            var rules = await dbContext.CategoryRules.ToListAsync();
            var byId = rules.ToDictionary(rule => rule.Id);
            for (var index = 0; index < ids.Count; index++)
            {
                if (byId.TryGetValue(ids[index], out var rule))
                {
                    rule.SortOrder = index;
                }
            }

            await dbContext.SaveChangesAsync();
            return true;
        });
    }

    public static Task<List<CategoryRuleApplyPreviewItem>> PreviewApplyAsync(PreviewApplyRequest? request)
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            var rules = await dbContext.CategoryRules
                .Where(rule => rule.Enabled)
                .OrderBy(rule => rule.SortOrder)
                .ThenBy(rule => rule.Id)
                .ToListAsync();

            var transactions = await TransactionQuery.Filter(
                    dbContext.Transactions.AsNoTracking(),
                    new TransactionListQuery
                    {
                        PocketId = request?.PocketId,
                        From = request?.From,
                        To = request?.To,
                    })
                .OrderByDescending(transaction => transaction.Date)
                .ThenByDescending(transaction => transaction.Id)
                .ToListAsync();

            return BuildApplyPreview(transactions, rules);
        });
    }

    public static Task<int> ApplyAsync(IReadOnlyList<int> transactionIds)
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            var rules = await dbContext.CategoryRules
                .Where(rule => rule.Enabled)
                .OrderBy(rule => rule.SortOrder)
                .ThenBy(rule => rule.Id)
                .ToListAsync();

            var transactions = await dbContext.Transactions
                .Where(transaction => transaction.Id.HasValue && transactionIds.Contains(transaction.Id.Value))
                .ToListAsync();

            var updated = 0;
            foreach (var transaction in transactions)
            {
                var match = CategoryRuleMatcher.FindMatch(
                    transaction.Description,
                    transaction.Amount,
                    transaction.Category,
                    rules,
                    transaction.PocketId);
                if (match is null || match.TargetCategory == transaction.Category)
                {
                    continue;
                }

                transaction.Category = match.TargetCategory;
                updated++;
            }

            await dbContext.SaveChangesAsync();
            return updated;
        });
    }

    public static Task<int> BackfillConditionLogicAsync()
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            var rows = await dbContext.Database
                .SqlQueryRaw<CategoryRuleGroupsRow>(
                    "SELECT \"Id\", \"Groups\"::text AS \"GroupsJson\" FROM \"CategoryRules\"")
                .ToListAsync();

            var updated = 0;
            foreach (var row in rows)
            {
                if (!TryMigrateGroupsJson(row.GroupsJson, out var migrated))
                {
                    continue;
                }

                await dbContext.Database.ExecuteSqlInterpolatedAsync(
                    $"UPDATE \"CategoryRules\" SET \"Groups\" = CAST({migrated} AS jsonb) WHERE \"Id\" = {row.Id}");
                updated++;
            }

            return updated;
        });
    }

    public static bool TryMigrateGroupsJson(string json, out string migrated)
    {
        var legacyGroups = JsonSerializer.Deserialize<List<LegacyCategoryRuleGroup>>(json, CategoryRuleJson.Options)
            ?? [];
        var changed = false;
        var groups = new List<CategoryRuleGroup>();
        foreach (var legacy in legacyGroups)
        {
            var conditions = legacy.Conditions ?? [];
            var fallback = legacy.Logic ?? RuleLogic.And;
            if (legacy.Logic is not null)
            {
                changed = true;
            }

            for (var index = 0; index < conditions.Count; index++)
            {
                if (index == 0)
                {
                    if (conditions[index].Logic is not null)
                    {
                        conditions[index].Logic = null;
                        changed = true;
                    }

                    continue;
                }

                if (conditions[index].Logic is null)
                {
                    conditions[index].Logic = fallback;
                    changed = true;
                }
            }

            groups.Add(new CategoryRuleGroup { Conditions = conditions });
        }

        migrated = JsonSerializer.Serialize(groups, CategoryRuleJson.Options);
        return changed;
    }

    public void Normalize()
    {
        Name = Name.Trim();
        MigrateConditionLogic();
        foreach (var group in Groups)
        {
            foreach (var condition in group.Conditions)
            {
                condition.Value = condition.Value?.Trim() ?? string.Empty;
            }
        }
    }

    public bool MigrateConditionLogic()
    {
        Groups ??= [];
        var changed = false;
        foreach (var group in Groups)
        {
            group.Conditions ??= [];
            for (var index = 0; index < group.Conditions.Count; index++)
            {
                var condition = group.Conditions[index];
                if (index == 0)
                {
                    if (condition.Logic is not null)
                    {
                        condition.Logic = null;
                        changed = true;
                    }

                    continue;
                }

                if (condition.Logic is null)
                {
                    condition.Logic = RuleLogic.And;
                    changed = true;
                }
            }
        }

        return changed;
    }

    public void Validate()
    {
        if (string.IsNullOrWhiteSpace(Name))
        {
            throw new ArgumentException("A rule name is required.");
        }

        if (Groups.Count == 0)
        {
            throw new ArgumentException("A rule must have at least one group.");
        }

        for (var groupIndex = 0; groupIndex < Groups.Count; groupIndex++)
        {
            var group = Groups[groupIndex];
            if (group.Conditions.Count == 0)
            {
                throw new ArgumentException($"Group {groupIndex + 1} must have at least one condition.");
            }

            for (var conditionIndex = 0; conditionIndex < group.Conditions.Count; conditionIndex++)
            {
                var condition = group.Conditions[conditionIndex];
                if (conditionIndex > 0 && condition.Logic is null)
                {
                    throw new ArgumentException(
                        $"Group {groupIndex + 1}, condition {conditionIndex + 1} needs And or Or to combine with the previous condition.");
                }

                ValidateCondition(condition, groupIndex, conditionIndex);
            }
        }
    }

    private static void ValidateCondition(CategoryRuleCondition condition, int groupIndex, int conditionIndex)
    {
        var label = $"Group {groupIndex + 1}, condition {conditionIndex + 1}";
        if (string.IsNullOrWhiteSpace(condition.Value))
        {
            throw new ArgumentException($"{label} is missing a value.");
        }

        if (!CategoryRuleMatcher.IsOperatorAllowed(condition.Field, condition.Operator))
        {
            throw new ArgumentException($"{label} uses an operator that is not valid for {condition.Field}.");
        }

        if (condition.Field == RuleField.Amount
            && !decimal.TryParse(condition.Value, NumberStyles.Number, CultureInfo.InvariantCulture, out _))
        {
            throw new ArgumentException($"{label} amount value is not a number.");
        }

        if (condition.Field == RuleField.Category
            && !Enum.TryParse<Transaction.TransactionCategory>(condition.Value, ignoreCase: true, out _))
        {
            throw new ArgumentException($"{label} category value is not a known category.");
        }

        if (condition.Field == RuleField.Pocket
            && (!int.TryParse(condition.Value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var pocketId)
                || pocketId <= 0))
        {
            throw new ArgumentException($"{label} pocket value must be a pocket id.");
        }
    }

    private static List<CategoryRuleApplyPreviewItem> BuildApplyPreview(
        List<Transaction> transactions,
        IReadOnlyList<CategoryRule> rules)
    {
        var changes = new List<CategoryRuleApplyPreviewItem>();
        foreach (var transaction in transactions)
        {
            if (!transaction.Id.HasValue)
            {
                continue;
            }

            var match = CategoryRuleMatcher.FindMatch(
                transaction.Description,
                transaction.Amount,
                transaction.Category,
                rules,
                transaction.PocketId);
            if (match is null || match.TargetCategory == transaction.Category)
            {
                continue;
            }

            changes.Add(new CategoryRuleApplyPreviewItem
            {
                TransactionId = transaction.Id.Value,
                Description = transaction.Description,
                Amount = transaction.Amount,
                Date = transaction.Date,
                OldCategory = transaction.Category,
                NewCategory = match.TargetCategory,
                MatchedRuleId = match.Id,
                MatchedRuleName = match.Name,
            });
        }

        return changes;
    }
}

public class CategoryRuleGroup
{
    public List<CategoryRuleCondition> Conditions { get; set; } = [];
}

file class LegacyCategoryRuleGroup
{
    public RuleLogic? Logic { get; set; }

    public List<CategoryRuleCondition> Conditions { get; set; } = [];
}

file class CategoryRuleGroupsRow
{
    public int Id { get; set; }

    public string GroupsJson { get; set; } = string.Empty;
}

public class CategoryRuleCondition
{
    /// <summary>
    /// How this condition combines with the previous one. Null on the first condition.
    /// Conditions in a group are evaluated left to right.
    /// </summary>
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public RuleLogic? Logic { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public RuleField Field { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public RuleOperator Operator { get; set; }

    public string Value { get; set; } = string.Empty;
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum RuleLogic
{
    And,
    Or,
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum RuleField
{
    Description,
    Amount,
    Category,
    Pocket,
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum RuleOperator
{
    Contains,
    Equals,
    Gt,
    Gte,
    Lt,
    Lte,
    Eq,
    NotEquals,
}
