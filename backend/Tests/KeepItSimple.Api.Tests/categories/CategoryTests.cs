using System.Text.Json;
using KeepItSimple.Api.Models;
using KeepItSimple.Api.dtos.Transaction;
using KeepItSimple.Api.Helpers;
using KeepItSimple.Api.Tests.Support;

namespace KeepItSimple.Api.Tests.Categories;

public class CategoryTests
{
    private static readonly JsonSerializerOptions Web = new(JsonSerializerDefaults.Web);

    private static Category NewCategory(string name = "Pets", CategoryKind kind = CategoryKind.Expense) =>
        new() { Name = name, Kind = kind, Icon = "PawPrint", Color = "#AABBCC" };

    private static async Task<int> NewPocketAsync(string userId) =>
        (await Pocket.Update(new Pocket { Name = "Main" }, userId))!.Id;

    private static Transaction NewTransaction(int pocketId, int categoryId) =>
        new() { Amount = -5m, Date = DateTime.UtcNow, CategoryId = categoryId, PocketId = pocketId };

    private static CategoryRule NewRule(int categoryId) => new()
    {
        Name = "rule",
        TargetCategoryId = categoryId,
        Groups =
        [
            new CategoryRuleGroup
            {
                Conditions = [new CategoryRuleCondition { Field = RuleField.Description, Operator = RuleOperator.Contains, Value = "x" }],
            },
        ],
    };

    [Fact]
    public async Task GetVisible_returns_system_rows_and_own_custom_rows_only()
    {
        var owner = TestApp.NewUserId();
        var stranger = TestApp.NewUserId();
        var created = await Category.CreateAsync(NewCategory(), owner);

        var ownerList = await Category.GetVisibleAsync(owner);
        var strangerList = await Category.GetVisibleAsync(stranger);

        Assert.Equal(58, strangerList.Count);
        Assert.Contains(ownerList, c => c.Id == created.Id);
        Assert.DoesNotContain(strangerList, c => c.Id == created.Id);
        Assert.Equal("Coffe", ownerList.Single(c => c.Id == 1).Key);
    }

    [Fact]
    public async Task Create_update_delete_roundtrip()
    {
        var owner = TestApp.NewUserId();
        var created = await Category.CreateAsync(NewCategory("  Pets  "), owner);

        Assert.Equal("Pets", created.Name);
        Assert.Equal(owner, created.UserId);
        Assert.Equal("Custom", created.Group);
        Assert.Null(created.Key);

        var edit = NewCategory("Animals", CategoryKind.Income);
        edit.Id = created.Id;
        var updated = await Category.UpdateAsync(edit, owner);
        Assert.Equal("Animals", updated!.Name);
        Assert.Equal(CategoryKind.Income, updated.Kind);

        Assert.True(await Category.DeleteAsync(created.Id, owner));
        Assert.Null(await Category.GetByIdAsync(created.Id, owner));
    }

    [Theory]
    [InlineData("", "#AABBCC", "Icon", CategoryKind.Expense)]
    [InlineData("   ", "#AABBCC", "Icon", CategoryKind.Expense)]
    [InlineData("0123456789012345678901234567890123456789X", "#AABBCC", "Icon", CategoryKind.Expense)]
    [InlineData("Ok", "red", "Icon", CategoryKind.Expense)]
    [InlineData("Ok", "#AABBC", "Icon", CategoryKind.Expense)]
    [InlineData("Ok", "#AABBCC", "", CategoryKind.Expense)]
    [InlineData("Ok", "#AABBCC", "Icon", CategoryKind.Saving)]
    [InlineData("Ok", "#AABBCC", "Icon", CategoryKind.Transfer)]
    public async Task Create_rejects_invalid_input(string name, string color, string icon, CategoryKind kind)
    {
        var category = new Category { Name = name, Color = color, Icon = icon, Kind = kind };

        await Assert.ThrowsAsync<ArgumentException>(() => Category.CreateAsync(category, TestApp.NewUserId()));
    }

    [Fact]
    public async Task Create_rejects_duplicate_name_of_system_row_or_own_row_case_insensitively()
    {
        var owner = TestApp.NewUserId();
        await Category.CreateAsync(NewCategory("Pets"), owner);

        await Assert.ThrowsAsync<ArgumentException>(() => Category.CreateAsync(NewCategory("food"), owner));
        await Assert.ThrowsAsync<ArgumentException>(() => Category.CreateAsync(NewCategory("PETS"), owner));
        // Another user may reuse a custom name.
        await Category.CreateAsync(NewCategory("Pets"), TestApp.NewUserId());
    }

    [Fact]
    public async Task System_row_cannot_be_updated_deleted_or_inspected()
    {
        var user = TestApp.NewUserId();
        var edit = NewCategory("Renamed");
        edit.Id = (int)Transaction.TransactionCategory.Food;

        Assert.Null(await Category.UpdateAsync(edit, user));
        Assert.False(await Category.DeleteAsync(edit.Id, user));
        Assert.Null(await Category.GetUsageAsync(edit.Id, user));
    }

    [Fact]
    public async Task Another_user_cannot_read_update_or_delete_a_category()
    {
        var owner = TestApp.NewUserId();
        var stranger = TestApp.NewUserId();
        var created = await Category.CreateAsync(NewCategory(), owner);
        var edit = NewCategory("Hacked");
        edit.Id = created.Id;

        Assert.Null(await Category.GetUsageAsync(created.Id, stranger));
        Assert.Null(await Category.UpdateAsync(edit, stranger));
        Assert.False(await Category.DeleteAsync(created.Id, stranger));
        Assert.NotNull(await Category.GetByIdAsync(created.Id, owner));
    }

    [Fact]
    public async Task Another_users_category_cannot_be_assigned_to_a_transaction_or_rule()
    {
        var owner = TestApp.NewUserId();
        var stranger = TestApp.NewUserId();
        var created = await Category.CreateAsync(NewCategory(), owner);
        var strangerPocket = await NewPocketAsync(stranger);

        await Assert.ThrowsAsync<ArgumentException>(() => Transaction.Update(NewTransaction(strangerPocket, created.Id), stranger));
        await Assert.ThrowsAsync<ArgumentException>(() => CategoryRule.CreateAsync(NewRule(created.Id), stranger));
        await Assert.ThrowsAsync<ArgumentException>(() => Transaction.Update(NewTransaction(strangerPocket, 99999), stranger));
    }

    [Fact]
    public async Task Own_category_can_be_assigned_and_is_counted_in_usage()
    {
        var owner = TestApp.NewUserId();
        var created = await Category.CreateAsync(NewCategory(), owner);
        var pocketId = await NewPocketAsync(owner);
        await Transaction.Update(NewTransaction(pocketId, created.Id), owner);
        await CategoryRule.CreateAsync(NewRule(created.Id), owner);

        var usage = await Category.GetUsageAsync(created.Id, owner);

        Assert.Equal(1, usage!.Transactions);
        Assert.Equal(1, usage.Rules);
    }

    [Fact]
    public async Task Delete_moves_transactions_to_Other_and_disables_rules()
    {
        var owner = TestApp.NewUserId();
        var created = await Category.CreateAsync(NewCategory(), owner);
        var pocketId = await NewPocketAsync(owner);
        var transaction = await Transaction.Update(NewTransaction(pocketId, created.Id), owner);
        var rule = await CategoryRule.CreateAsync(NewRule(created.Id), owner);

        Assert.True(await Category.DeleteAsync(created.Id, owner));

        var after = await Transaction.GetByIdAsync(transaction!.Id!.Value, owner);
        Assert.Equal((int)Transaction.TransactionCategory.Other, after!.CategoryId);
        var ruleAfter = await CategoryRule.GetByIdAsync(rule.Id, owner);
        Assert.False(ruleAfter!.Enabled);
        Assert.Equal((int)Transaction.TransactionCategory.Other, ruleAfter.TargetCategoryId);
    }

    [Fact]
    public async Task Filter_by_categoryId_and_foreign_id_returns_empty()
    {
        var owner = TestApp.NewUserId();
        var stranger = TestApp.NewUserId();
        var custom = await Category.CreateAsync(NewCategory(), owner);
        var pocketId = await NewPocketAsync(owner);
        await Transaction.Update(NewTransaction(pocketId, custom.Id), owner);
        await Transaction.Update(NewTransaction(pocketId, (int)Transaction.TransactionCategory.Food), owner);

        var byId = await Transaction.GetPagedAsync(new TransactionListQuery { CategoryId = custom.Id }, owner);
        var foreign = await Transaction.GetPagedAsync(new TransactionListQuery { CategoryId = custom.Id }, stranger);

        Assert.Single(byId.Items);
        Assert.Empty(foreign.Items);
    }
}
