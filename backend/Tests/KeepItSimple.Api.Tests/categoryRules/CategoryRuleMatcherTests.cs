using KeepItSimple.Api.Helpers;
using KeepItSimple.Api.Models;

namespace KeepItSimple.Api.Tests.CategoryRules;

public class CategoryRuleMatcherTests
{
    [Fact]
    public void FindMatch_returns_null_when_no_rule_matches()
    {
        var rules = new[]
        {
            Rule("Amazon", Transaction.TransactionCategory.Shopping, groups:
            [
                Group(And(DescriptionContains("Amazon"))),
            ]),
        };

        var match = CategoryRuleMatcher.FindMatch("Starbucks", -4.50m, Transaction.TransactionCategory.Other, rules);

        Assert.Null(match);
    }

    [Fact]
    public void FindMatch_and_group_requires_every_condition()
    {
        var rules = new[]
        {
            Rule("Amazon shopping", Transaction.TransactionCategory.Shopping, groups:
            [
                Group(
                    And(AmountLt("0"), DescriptionContains("Amazon")),
                    RuleLogic.And),
            ]),
        };

        var amazonExpense = CategoryRuleMatcher.FindMatch("Amazon Prime", -12m, Transaction.TransactionCategory.Other, rules);
        var amazonIncome = CategoryRuleMatcher.FindMatch("Amazon refund", 12m, Transaction.TransactionCategory.Other, rules);

        Assert.Equal(Transaction.TransactionCategory.Shopping, amazonExpense?.TargetCategory);
        Assert.Null(amazonIncome);
    }

    [Fact]
    public void FindMatch_amount_gt_and_description_or_group()
    {
        var rules = new[]
        {
            Rule(
                "Income with description match",
                Transaction.TransactionCategory.Salary,
                RuleLogic.And,
                [
                    Group(And(AmountGt("0"))),
                    Group(
                        And(DescriptionEquals("stipendio"), DescriptionContains("accredito")),
                        RuleLogic.Or),
                ]),
        };

        var equalsMatch = CategoryRuleMatcher.FindMatch("Stipendio", 2500m, Transaction.TransactionCategory.Other, rules);
        var containsMatch = CategoryRuleMatcher.FindMatch("Accredito mensile", 1800m, Transaction.TransactionCategory.Other, rules);
        var expense = CategoryRuleMatcher.FindMatch("Stipendio", -2500m, Transaction.TransactionCategory.Other, rules);
        var otherIncome = CategoryRuleMatcher.FindMatch("Freelance", 500m, Transaction.TransactionCategory.Other, rules);

        Assert.Equal(Transaction.TransactionCategory.Salary, equalsMatch?.TargetCategory);
        Assert.Equal(Transaction.TransactionCategory.Salary, containsMatch?.TargetCategory);
        Assert.Null(expense);
        Assert.Null(otherIncome);
    }

    [Fact]
    public void FindMatch_ignores_logic_on_a_single_condition_group()
    {
        var rules = new[]
        {
            Rule(
                "Single condition",
                Transaction.TransactionCategory.Food,
                RuleLogic.And,
                [
                    Group(And(DescriptionContains("bar")), RuleLogic.Or),
                ]),
        };

        var match = CategoryRuleMatcher.FindMatch("Bar Centrale", -2m, Transaction.TransactionCategory.Other, rules);

        Assert.Equal(Transaction.TransactionCategory.Food, match?.TargetCategory);
    }

    [Fact]
    public void FindMatch_or_between_groups()
    {
        var rules = new[]
        {
            Rule(
                "Mixed",
                Transaction.TransactionCategory.Other,
                RuleLogic.Or,
                [
                    Group(And(AmountGt("1"), DescriptionEquals("x")), RuleLogic.And),
                    Group(And(DescriptionContains("y"))),
                ]),
        };

        Assert.NotNull(CategoryRuleMatcher.FindMatch("x", 2m, Transaction.TransactionCategory.Other, rules));
        Assert.NotNull(CategoryRuleMatcher.FindMatch("pay y", 0m, Transaction.TransactionCategory.Other, rules));
        Assert.Null(CategoryRuleMatcher.FindMatch("x", 0.5m, Transaction.TransactionCategory.Other, rules));
    }

    [Fact]
    public void FindMatch_first_enabled_rule_by_sort_order_wins()
    {
        var prime = Rule("Prime", Transaction.TransactionCategory.Subscriptions, groups:
        [
            Group(And(DescriptionContains("Amazon Prime"))),
        ]);
        prime.SortOrder = 0;

        var amazon = Rule("Amazon", Transaction.TransactionCategory.Shopping, groups:
        [
            Group(And(DescriptionContains("Amazon"))),
        ]);
        amazon.SortOrder = 1;

        var match = CategoryRuleMatcher.FindMatch(
            "Amazon Prime Video",
            -9.99m,
            Transaction.TransactionCategory.Other,
            [prime, amazon]);

        Assert.Equal("Prime", match?.Name);
        Assert.Equal(Transaction.TransactionCategory.Subscriptions, match?.TargetCategory);
    }

    [Fact]
    public void FindMatch_skips_disabled_rules()
    {
        var disabled = Rule("Amazon", Transaction.TransactionCategory.Shopping, groups:
        [
            Group(And(DescriptionContains("Amazon"))),
        ]);
        disabled.Enabled = false;

        var match = CategoryRuleMatcher.FindMatch("Amazon", -10m, Transaction.TransactionCategory.Other, [disabled]);

        Assert.Null(match);
    }

    [Fact]
    public void FindMatch_description_is_case_insensitive()
    {
        var rules = new[]
        {
            Rule("Amazon", Transaction.TransactionCategory.Shopping, groups:
            [
                Group(And(DescriptionContains("amazon"))),
            ]),
        };

        var match = CategoryRuleMatcher.FindMatch("AMAZON MARKETPLACE", -20m, Transaction.TransactionCategory.Other, rules);

        Assert.Equal(Transaction.TransactionCategory.Shopping, match?.TargetCategory);
    }

    [Fact]
    public void FindMatch_description_equals_is_case_insensitive()
    {
        var rules = new[]
        {
            Rule("Eni", Transaction.TransactionCategory.Car, groups:
            [
                Group(And(DescriptionEquals("eni"))),
            ]),
        };

        var match = CategoryRuleMatcher.FindMatch("ENI", -40m, Transaction.TransactionCategory.Other, rules);

        Assert.Equal(Transaction.TransactionCategory.Car, match?.TargetCategory);
    }

    [Fact]
    public void FindMatch_description_contains_matches_whole_words_only()
    {
        var rules = new[]
        {
            Rule("Eni", Transaction.TransactionCategory.Car, groups:
            [
                Group(And(DescriptionContains("eni"))),
            ]),
        };

        Assert.NotNull(CategoryRuleMatcher.FindMatch("PAGAMENTO ENI PV", -50m, Transaction.TransactionCategory.Other, rules));
        Assert.NotNull(CategoryRuleMatcher.FindMatch("ENI", -40m, Transaction.TransactionCategory.Other, rules));
        Assert.Null(CategoryRuleMatcher.FindMatch("Enoteca Souvenirs Di Lag", -12m, Transaction.TransactionCategory.Other, rules));
    }

    [Fact]
    public void FindMatch_can_use_existing_category()
    {
        var rules = new[]
        {
            Rule(
                "Reclassify other amazon",
                Transaction.TransactionCategory.Shopping,
                RuleLogic.And,
                [
                    Group(And(CategoryEquals("Other"))),
                    Group(And(DescriptionContains("Amazon"))),
                ]),
        };

        var match = CategoryRuleMatcher.FindMatch("Amazon", -15m, Transaction.TransactionCategory.Other, rules);
        var alreadyShopping = CategoryRuleMatcher.FindMatch("Amazon", -15m, Transaction.TransactionCategory.Shopping, rules);

        Assert.Equal(Transaction.TransactionCategory.Shopping, match?.TargetCategory);
        Assert.Null(alreadyShopping);
    }

    [Fact]
    public void FindMatch_without_category_condition_only_applies_to_other()
    {
        var rules = new[]
        {
            Rule("Amazon", Transaction.TransactionCategory.Shopping, groups:
            [
                Group(And(DescriptionContains("Amazon"))),
            ]),
        };

        var uncategorized = CategoryRuleMatcher.FindMatch(
            "Amazon",
            -15m,
            Transaction.TransactionCategory.Other,
            rules);
        var alreadyFood = CategoryRuleMatcher.FindMatch(
            "Amazon",
            -15m,
            Transaction.TransactionCategory.Food,
            rules);

        Assert.Equal(Transaction.TransactionCategory.Shopping, uncategorized?.TargetCategory);
        Assert.Null(alreadyFood);
    }

    [Fact]
    public void FindMatch_with_category_condition_can_reclassify()
    {
        var rules = new[]
        {
            Rule(
                "Food amazon to shopping",
                Transaction.TransactionCategory.Shopping,
                RuleLogic.And,
                [
                    Group(And(CategoryEquals("Food"))),
                    Group(And(DescriptionContains("Amazon"))),
                ]),
        };

        var foodAmazon = CategoryRuleMatcher.FindMatch(
            "Amazon",
            -15m,
            Transaction.TransactionCategory.Food,
            rules);
        var otherAmazon = CategoryRuleMatcher.FindMatch(
            "Amazon",
            -15m,
            Transaction.TransactionCategory.Other,
            rules);

        Assert.Equal(Transaction.TransactionCategory.Shopping, foodAmazon?.TargetCategory);
        Assert.Null(otherAmazon);
    }

    [Fact]
    public void FindMatch_can_use_pocket()
    {
        var rules = new[]
        {
            Rule("Checking amazon", Transaction.TransactionCategory.Shopping, groups:
            [
                Group(
                    And(PocketEquals("3"), DescriptionContains("Amazon")),
                    RuleLogic.And),
            ]),
        };

        var checking = CategoryRuleMatcher.FindMatch(
            "Amazon",
            -15m,
            Transaction.TransactionCategory.Other,
            rules,
            pocketId: 3);
        var savings = CategoryRuleMatcher.FindMatch(
            "Amazon",
            -15m,
            Transaction.TransactionCategory.Other,
            rules,
            pocketId: 7);

        Assert.Equal(Transaction.TransactionCategory.Shopping, checking?.TargetCategory);
        Assert.Null(savings);
    }

    [Fact]
    public void FindMatch_pocket_not_equals()
    {
        var rules = new[]
        {
            Rule("Not cash", Transaction.TransactionCategory.Shopping, groups:
            [
                Group(And(PocketNotEquals("2"), DescriptionContains("Amazon"))),
            ]),
        };

        Assert.NotNull(
            CategoryRuleMatcher.FindMatch(
                "Amazon",
                -10m,
                Transaction.TransactionCategory.Other,
                rules,
                pocketId: 1));
        Assert.Null(
            CategoryRuleMatcher.FindMatch(
                "Amazon",
                -10m,
                Transaction.TransactionCategory.Other,
                rules,
                pocketId: 2));
    }

    [Fact]
    public void Empty_description_does_not_match_contains()
    {
        var rules = new[]
        {
            Rule("Amazon", Transaction.TransactionCategory.Shopping, groups:
            [
                Group(And(DescriptionContains("Amazon"))),
            ]),
        };

        Assert.Null(CategoryRuleMatcher.FindMatch(null, -10m, Transaction.TransactionCategory.Other, rules));
        Assert.Null(CategoryRuleMatcher.FindMatch("  ", -10m, Transaction.TransactionCategory.Other, rules));
    }

    private static CategoryRule Rule(
        string name,
        Transaction.TransactionCategory target,
        RuleLogic groupLogic = RuleLogic.Or,
        params CategoryRuleGroup[] groups)
    {
        return new CategoryRule
        {
            Name = name,
            Enabled = true,
            TargetCategory = target,
            GroupLogic = groupLogic,
            Groups = [.. groups],
        };
    }

    private static CategoryRuleGroup Group(CategoryRuleCondition[] conditions, RuleLogic? logic = null)
    {
        return new CategoryRuleGroup { Logic = logic, Conditions = [.. conditions] };
    }

    private static CategoryRuleCondition[] And(params CategoryRuleCondition[] conditions) => conditions;

    private static CategoryRuleCondition DescriptionContains(string value) =>
        new() { Field = RuleField.Description, Operator = RuleOperator.Contains, Value = value };

    private static CategoryRuleCondition DescriptionEquals(string value) =>
        new() { Field = RuleField.Description, Operator = RuleOperator.Equals, Value = value };

    private static CategoryRuleCondition AmountGt(string value) =>
        new() { Field = RuleField.Amount, Operator = RuleOperator.Gt, Value = value };

    private static CategoryRuleCondition AmountLt(string value) =>
        new() { Field = RuleField.Amount, Operator = RuleOperator.Lt, Value = value };

    private static CategoryRuleCondition CategoryEquals(string value) =>
        new() { Field = RuleField.Category, Operator = RuleOperator.Equals, Value = value };

    private static CategoryRuleCondition PocketEquals(string value) =>
        new() { Field = RuleField.Pocket, Operator = RuleOperator.Equals, Value = value };

    private static CategoryRuleCondition PocketNotEquals(string value) =>
        new() { Field = RuleField.Pocket, Operator = RuleOperator.NotEquals, Value = value };
}
