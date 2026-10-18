using KeepItSimple.Api.Helpers;
using KeepItSimple.Api.Models;
using KeepItSimple.Api.dtos.Transaction;
using KeepItSimple.Api.Tests.Support;
using static KeepItSimple.Api.Helpers.TransactionImporter;

namespace KeepItSimple.Api.Tests.Ownership;

/// <summary>
/// Each user only sees and changes their own pockets, transactions, category rules and import sessions.
/// </summary>
public class OwnershipTests
{
    [Fact]
    public async Task Pocket_of_another_user_is_not_found()
    {
        var owner = TestApp.NewUserId();
        var stranger = TestApp.NewUserId();
        var pocket = await Pocket.Update(new Pocket { Name = "Main", Balance = 100 }, owner);
        var id = pocket!.Id;

        Assert.Null(await Pocket.GetByIdAsync(id, stranger));
        Assert.Null(await Pocket.Update(new Pocket { Id = id, Name = "Hacked" }, stranger));
        Assert.False(await Pocket.Delete(id, stranger));
        Assert.NotNull(await Pocket.GetByIdAsync(id, owner));
    }

    [Fact]
    public async Task GetAll_returns_only_own_pockets_and_rules()
    {
        var owner = TestApp.NewUserId();
        var stranger = TestApp.NewUserId();
        var ownerPocket = await Pocket.Update(new Pocket { Name = "Owner" }, owner);
        var strangerPocket = await Pocket.Update(new Pocket { Name = "Stranger" }, stranger);
        var ownerRule = await CategoryRule.CreateAsync(NewRule("owner rule"), owner);
        var strangerRule = await CategoryRule.CreateAsync(NewRule("stranger rule"), stranger);

        var ownerPockets = await Pocket.GetAllAsync(owner);
        var strangerPockets = await Pocket.GetAllAsync(stranger);
        var ownerRules = await CategoryRule.GetAllAsync(owner);
        var strangerRules = await CategoryRule.GetAllAsync(stranger);

        Assert.Single(ownerPockets);
        Assert.Equal(ownerPocket!.Id, ownerPockets[0].Id);
        Assert.Single(strangerPockets);
        Assert.Equal(strangerPocket!.Id, strangerPockets[0].Id);
        Assert.Single(ownerRules);
        Assert.Equal(ownerRule.Id, ownerRules[0].Id);
        Assert.Single(strangerRules);
        Assert.Equal(strangerRule.Id, strangerRules[0].Id);
    }

    [Fact]
    public async Task Create_sets_owner_from_caller_not_body()
    {
        var owner = TestApp.NewUserId();
        var stranger = TestApp.NewUserId();

        var pocket = await Pocket.Update(new Pocket { Name = "x", UserId = stranger }, owner);
        var spoofedRule = NewRule("spoofed");
        spoofedRule.UserId = stranger;
        var rule = await CategoryRule.CreateAsync(spoofedRule, owner);

        Assert.NotNull(await Pocket.GetByIdAsync(pocket!.Id, owner));
        Assert.Null(await Pocket.GetByIdAsync(pocket.Id, stranger));
        Assert.Equal(owner, (await Pocket.GetByIdAsync(pocket.Id, owner))!.UserId);
        Assert.Equal(owner, (await CategoryRule.GetByIdAsync(rule.Id, owner))!.UserId);
        Assert.Null(await CategoryRule.GetByIdAsync(rule.Id, stranger));
    }

    [Fact]
    public async Task Delete_repeated_id_reverts_the_amount_once()
    {
        var owner = TestApp.NewUserId();
        var pocket = await Pocket.Update(new Pocket { Name = "Main", Balance = 100 }, owner);
        var transaction = await Transaction.Update(NewTransaction(pocket!.Id, -20m), owner);
        var id = transaction!.Id!.Value;

        Assert.True(await Transaction.Delete([id, id], owner));

        Assert.Equal(100m, (await Pocket.GetByIdAsync(pocket.Id, owner))!.Balance);
    }

    [Fact]
    public async Task Transaction_in_another_users_pocket_is_not_found()
    {
        var owner = TestApp.NewUserId();
        var stranger = TestApp.NewUserId();
        var ownerPocket = await Pocket.Update(new Pocket { Name = "Owner", Balance = 0 }, owner);
        var strangerPocket = await Pocket.Update(new Pocket { Name = "Stranger", Balance = 0 }, stranger);
        var transaction = await Transaction.Update(NewTransaction(ownerPocket!.Id, -10m), owner);
        var transactionId = transaction!.Id!.Value;

        Assert.Null(await Transaction.GetByIdAsync(transactionId, stranger));
        Assert.Null(await Transaction.Update(new Transaction
        {
            Id = transactionId,
            Amount = -1m,
            Date = DateTime.UtcNow,
            Category = Transaction.TransactionCategory.Food,
            PocketId = strangerPocket!.Id,
        }, stranger));
        Assert.False(await Transaction.Delete([transactionId], stranger));
        Assert.Empty(await Transaction.GetByPocketIdAsync(ownerPocket.Id, stranger));
        Assert.Null(await Transaction.CreateTransfer(ownerPocket.Id, strangerPocket.Id, 5m, DateTime.UtcNow, "t", stranger));
        Assert.NotNull(await Transaction.GetByIdAsync(transactionId, owner));
    }

    [Fact]
    public async Task Rule_sort_order_is_per_user()
    {
        var owner = TestApp.NewUserId();
        var stranger = TestApp.NewUserId();

        var first = await CategoryRule.CreateAsync(NewRule("first"), owner);
        var second = await CategoryRule.CreateAsync(NewRule("second"), owner);
        var strangerRule = await CategoryRule.CreateAsync(NewRule("stranger"), stranger);

        Assert.Equal(0, first.SortOrder);
        Assert.Equal(1, second.SortOrder);
        Assert.Equal(0, strangerRule.SortOrder);
    }

    [Fact]
    public async Task Import_preview_of_another_users_session_is_not_found()
    {
        var owner = TestApp.NewUserId();
        var stranger = TestApp.NewUserId();

        using var stream = ImportFixtures.Open("transactions.xlsx");
        var analyzed = TransactionImporter.Analyze(stream, owner);

        var request = new TransactionImportPreviewRequest
        {
            SessionId = analyzed.SessionId,
            PocketId = 1,
            Mapping = ImportFixtures.MapInOrder(1, MappableField.Date, MappableField.Description, MappableField.Amount, MappableField.Ignore),
        };

        Assert.Throws<KeyNotFoundException>(() => TransactionImporter.Preview(request, stranger));
    }

    private static CategoryRule NewRule(string name) => new()
    {
        Name = name,
        Enabled = true,
        TargetCategory = Transaction.TransactionCategory.Food,
        GroupLogic = RuleLogic.Or,
        Groups =
        [
            new CategoryRuleGroup
            {
                Conditions =
                [
                    new CategoryRuleCondition { Field = RuleField.Description, Operator = RuleOperator.Contains, Value = "coffee" },
                ],
            },
        ],
    };

    private static Transaction NewTransaction(int pocketId, decimal amount) => new()
    {
        Amount = amount,
        Date = DateTime.UtcNow,
        Description = "coffee",
        Category = Transaction.TransactionCategory.Food,
        PocketId = pocketId,
    };
}
