using System.Security.Claims;
using System.Text.Json;
using KeepItSimple.Api.Controllers;
using KeepItSimple.Api.dtos.Transaction;
using KeepItSimple.Api.Helpers;
using KeepItSimple.Api.Models;
using static KeepItSimple.Api.Helpers.TransactionImporter;
using static KeepItSimple.Api.Models.Analytics.Analytics;
using KeepItSimple.Api.Tests.Support;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace KeepItSimple.Api.Tests.Categories;

// Rules, import, analytics and with custom categories (#91).
public class CustomCategoryBehaviorTests
{
    private static readonly DateTime Now = new(2026, 9, 20, 12, 0, 0, DateTimeKind.Utc);
    private static readonly int Other = (int)Transaction.TransactionCategory.Other;
    private static readonly int Food = (int)Transaction.TransactionCategory.Food;

    private static Category NewCategory(CategoryKind kind) =>
        new() { Name = $"Cat {Guid.NewGuid():N}", Kind = kind, Icon = "Tag", Color = "#AABBCC" };

    private static CategoryRule Rule(string conditionValue, int target, RuleField field = RuleField.Category) => new()
    {
        Name = "rule",
        TargetCategoryId = target,
        Groups =
        [
            new CategoryRuleGroup
            {
                Conditions = [new CategoryRuleCondition { Field = field, Operator = RuleOperator.Equals, Value = conditionValue }],
            },
        ],
    };

    [Fact]
    public void Matcher_accepts_an_id_and_a_custom_id_and_rejects_names()
    {
        Assert.NotNull(CategoryRuleMatcher.FindMatch("x", -1m, Food, [Rule(Food.ToString(), Other)]));
        Assert.Null(CategoryRuleMatcher.FindMatch("x", -1m, Food, [Rule("Food", Other)]));
        Assert.NotNull(CategoryRuleMatcher.FindMatch("x", -1m, 1005, [Rule("1005", Other)]));
        Assert.Null(CategoryRuleMatcher.FindMatch("x", -1m, Other, [Rule("1005", Other)]));
        Assert.Null(CategoryRuleMatcher.FindMatch("x", -1m, Food, [Rule("Nope", Other)]));
    }

    [Fact]
    public async Task Rule_validation_rejects_another_users_custom_id_and_accepts_own_and_rejects_names()
    {
        var owner = TestApp.NewUserId();
        var stranger = TestApp.NewUserId();
        var mine = await Category.CreateAsync(NewCategory(CategoryKind.Expense), owner);

        await CategoryRule.CreateAsync(Rule(mine.Id.ToString(), Other), owner);
        await Assert.ThrowsAsync<ArgumentException>(() => CategoryRule.CreateAsync(Rule("Food", Other), owner));
        await Assert.ThrowsAsync<ArgumentException>(() => CategoryRule.CreateAsync(Rule(mine.Id.ToString(), Other), stranger));
        await Assert.ThrowsAsync<ArgumentException>(() => CategoryRule.CreateAsync(Rule("Nope", Other), owner));
    }

    [Fact]
    public async Task Apply_and_preview_use_ids_so_a_custom_target_applies()
    {
        var user = TestApp.NewUserId();
        var custom = await Category.CreateAsync(NewCategory(CategoryKind.Expense), user);
        var pocketId = (await Pocket.Update(new Pocket { Name = "Main" }, user))!.Id;
        var rule = Rule(Other.ToString(), custom.Id);
        await CategoryRule.CreateAsync(rule, user);
        var saved = await Transaction.Update(
            new Transaction { Amount = -5m, Date = DateTime.UtcNow, CategoryId = Other, PocketId = pocketId },
            user);

        var preview = await CategoryRule.PreviewAsync(null, user);

        var item = Assert.Single(preview);
        Assert.Equal(Other, item.OldCategoryId);
        Assert.Equal(custom.Id, item.NewCategoryId);
        Assert.Equal(1, await CategoryRule.ApplyAsync([saved!.Id!.Value], user));
        Assert.Empty(await CategoryRule.PreviewAsync(null, user));
    }

    [Fact]
    public async Task Import_preview_uses_a_custom_default_and_rejects_a_foreign_one()
    {
        var user = ImportFixtures.UserId;
        var custom = await Category.CreateAsync(NewCategory(CategoryKind.Expense), user);
        var foreign = await Category.CreateAsync(NewCategory(CategoryKind.Expense), TestApp.NewUserId());
        var pocketId = (await Pocket.Update(new Pocket { Name = "Main" }, user))!.Id;
        var controller = new TransactionController
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity([new Claim("sub", user)], "test")),
                },
            },
        };

        ActionResult<PreviewResponse> Run(int categoryId) => controller.PreviewImport(new TransactionImportPreviewRequest
        {
            SessionId = ImportFixtures.Analyze("transactions.xlsx").SessionId,
            PocketId = pocketId,
            Mapping = ImportFixtures.MapInOrder(1, MappableField.Date, MappableField.Description, MappableField.Amount, MappableField.Ignore),
            DefaultCategoryId = categoryId,
        }).GetAwaiter().GetResult();

        var ok = Assert.IsType<OkObjectResult>(Run(custom.Id).Result);
        var drafts = Assert.IsType<PreviewResponse>(ok.Value).Transactions;
        Assert.All(drafts, draft => Assert.Equal(custom.Id, draft.CategoryId));
        Assert.IsType<BadRequestObjectResult>(Run(foreign.Id).Result);
    }

    [Fact]
    public void Analytics_counts_custom_income_and_expense_by_kind()
    {
        var income = new Category { Id = 1001, UserId = "u", Kind = CategoryKind.Income, Name = "Side gig" };
        var expense = new Category { Id = 1002, UserId = "u", Kind = CategoryKind.Expense, Name = "Pets" };
        var categories = new Dictionary<int, Category> { [income.Id] = income, [expense.Id] = expense };
        var transactions = new List<Transaction>
        {
            new() { Id = 1, PocketId = 1, CategoryId = income.Id, Amount = 300m, Date = new DateTime(2026, 9, 5, 0, 0, 0, DateTimeKind.Utc) },
            new() { Id = 2, PocketId = 1, CategoryId = expense.Id, Amount = -40m, Date = new DateTime(2026, 9, 6, 0, 0, 0, DateTimeKind.Utc) },
        };
        var pockets = new List<Pocket> { new() { Id = 1, Name = "Main" } };

        var incomeAnalytics = BuildIncomeAnalytics(transactions, pockets, Now, Now, categories);
        var overview = BuildOverview(transactions, pockets, Now, categories);

        Assert.Equal(300m, incomeAnalytics.TotalMonthlyIncome);
        Assert.Equal(40m, incomeAnalytics.MonthlyExpenses);
        Assert.Equal(300m, incomeAnalytics.TwelveMonthIncomeTrend.Single(m => m.Month == 9).CategoryIds[income.Id]);
        Assert.Equal(-40m, overview.MonthlyTotalExpenses);
        Assert.Equal(300m, overview.MonthlyTotalIncome);
        Assert.Equal(expense.Id, overview.TopExpenseCategoryId);

        using var json = JsonDocument.Parse(JsonSerializer.Serialize(overview, new JsonSerializerOptions(JsonSerializerDefaults.Web)));
        var top = json.RootElement.GetProperty("monthlyExpensesByCategory")[0];
        Assert.Equal(expense.Id, top.GetProperty("categoryId").GetInt32());
    }
}
