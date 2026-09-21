using System.Globalization;
using System.Text.RegularExpressions;
using KeepItSimple.Api.Models;

namespace KeepItSimple.Api.Helpers;

/// <summary>
/// Pure evaluator for <see cref="CategoryRule"/> trees. No I/O: callers pass the
/// transaction snapshot and the rules already ordered by <c>SortOrder</c>.
/// </summary>
public static class CategoryRuleMatcher
{
    public static CategoryRule? FindMatch(
        string? description,
        decimal amount,
        Transaction.TransactionCategory category,
        IReadOnlyList<CategoryRule> rules,
        int pocketId = 0)
    {
        foreach (var rule in rules)
        {
            if (!rule.Enabled)
            {
                continue;
            }

            if (MatchesRule(description, amount, category, pocketId, rule))
            {
                return rule;
            }
        }

        return null;
    }

    public static bool IsOperatorAllowed(RuleField field, RuleOperator op)
    {
        return field switch
        {
            RuleField.Description => op is RuleOperator.Contains or RuleOperator.Equals,
            RuleField.Amount => op is RuleOperator.Gt or RuleOperator.Gte or RuleOperator.Lt
                or RuleOperator.Lte or RuleOperator.Eq,
            RuleField.Category => op is RuleOperator.Equals or RuleOperator.NotEquals,
            RuleField.Pocket => op is RuleOperator.Equals or RuleOperator.NotEquals,
            _ => false,
        };
    }

    private static bool MatchesRule(
        string? description,
        decimal amount,
        Transaction.TransactionCategory category,
        int pocketId,
        CategoryRule rule)
    {
        if (rule.Groups is null || rule.Groups.Count == 0)
        {
            return false;
        }

        if (!HasCategoryCondition(rule) && category != Transaction.TransactionCategory.Other)
        {
            return false;
        }

        return rule.GroupLogic == RuleLogic.And
            ? rule.Groups.All(group => MatchesGroup(description, amount, category, pocketId, group))
            : rule.Groups.Any(group => MatchesGroup(description, amount, category, pocketId, group));
    }

    private static bool MatchesGroup(
        string? description,
        decimal amount,
        Transaction.TransactionCategory category,
        int pocketId,
        CategoryRuleGroup group)
    {
        if (group.Conditions is null || group.Conditions.Count == 0)
        {
            return false;
        }

        if (group.Conditions.Count == 1)
        {
            return MatchesCondition(description, amount, category, pocketId, group.Conditions[0]);
        }

        var logic = group.Logic ?? RuleLogic.And;
        return logic == RuleLogic.And
            ? group.Conditions.All(condition => MatchesCondition(description, amount, category, pocketId, condition))
            : group.Conditions.Any(condition => MatchesCondition(description, amount, category, pocketId, condition));
    }

    private static bool MatchesCondition(
        string? description,
        decimal amount,
        Transaction.TransactionCategory category,
        int pocketId,
        CategoryRuleCondition condition)
    {
        if (!IsOperatorAllowed(condition.Field, condition.Operator))
        {
            return false;
        }

        return condition.Field switch
        {
            RuleField.Description => MatchesDescription(description, condition),
            RuleField.Amount => MatchesAmount(amount, condition),
            RuleField.Category => MatchesCategory(category, condition),
            RuleField.Pocket => MatchesPocket(pocketId, condition),
            _ => false,
        };
    }

    private static bool HasCategoryCondition(CategoryRule rule)
    {
        return rule.Groups.Any(group =>
            group.Conditions is not null
            && group.Conditions.Any(condition => condition.Field == RuleField.Category));
    }

    private static bool MatchesDescription(string? description, CategoryRuleCondition condition)
    {
        if (string.IsNullOrWhiteSpace(description))
        {
            return false;
        }

        var haystack = description.Trim();
        var needle = condition.Value.Trim();
        if (needle.Length == 0)
        {
            return false;
        }

        return condition.Operator switch
        {
            RuleOperator.Contains => ContainsWordIgnoreCase(haystack, needle),
            RuleOperator.Equals => EqualsIgnoreCase(haystack, needle),
            _ => false,
        };
    }

    private static bool ContainsWordIgnoreCase(string haystack, string needle)
    {
        var pattern = $@"\b{Regex.Escape(needle)}\b";
        return Regex.IsMatch(haystack, pattern, RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
    }

    private static bool EqualsIgnoreCase(string left, string right)
    {
        return string.Equals(left, right, StringComparison.InvariantCultureIgnoreCase);
    }

    private static bool MatchesAmount(decimal amount, CategoryRuleCondition condition)
    {
        if (!decimal.TryParse(condition.Value, NumberStyles.Number, CultureInfo.InvariantCulture, out var expected))
        {
            return false;
        }

        return condition.Operator switch
        {
            RuleOperator.Gt => amount > expected,
            RuleOperator.Gte => amount >= expected,
            RuleOperator.Lt => amount < expected,
            RuleOperator.Lte => amount <= expected,
            RuleOperator.Eq => amount == expected,
            _ => false,
        };
    }

    private static bool MatchesCategory(
        Transaction.TransactionCategory category,
        CategoryRuleCondition condition)
    {
        if (!Enum.TryParse<Transaction.TransactionCategory>(condition.Value, ignoreCase: true, out var expected))
        {
            return false;
        }

        return condition.Operator switch
        {
            RuleOperator.Equals => category == expected,
            RuleOperator.NotEquals => category != expected,
            _ => false,
        };
    }

    private static bool MatchesPocket(int pocketId, CategoryRuleCondition condition)
    {
        if (!int.TryParse(condition.Value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var expected)
            || expected <= 0)
        {
            return false;
        }

        return condition.Operator switch
        {
            RuleOperator.Equals => pocketId == expected,
            RuleOperator.NotEquals => pocketId != expected,
            _ => false,
        };
    }
}
