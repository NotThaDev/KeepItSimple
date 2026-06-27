#if DEBUG
using KeepItSimple.Api.Helpers;
using KeepItSimple.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using static KeepItSimple.Api.Models.Transaction;

namespace KeepItSimple.Api.Controllers;

[ApiController]
[Route("api/test")]
public class TestDataController(IWebHostEnvironment environment) : ControllerBase
{
    private const decimal SeedPocketInitialBalance = 2800m;
    private const decimal MonthlyExpensesTarget = 1400m;
    private const decimal MonthlyIncomeTarget = 2250m;
    private const string SeedPocketName = "Test Portfolio";

    [HttpPost("seed-two-month-history")]
    public async Task<ActionResult<SeedTwoMonthHistoryResponse>> SeedTwoMonthHistory()
    {
        if (!environment.IsDevelopment())
        {
            return NotFound();
        }

        var result = await KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            var now = DateTime.UtcNow.Date;
            var previousMonthDate = now.AddMonths(-1);

            var daysInCurrentMonth = DateTime.DaysInMonth(now.Year, now.Month);
            var currentMonthDayLimit = now.Day;
            var currentMonthTarget = RoundToCents(
                MonthlyExpensesTarget * currentMonthDayLimit / daysInCurrentMonth
            );
            var currentMonthIncomeTarget = RoundToCents(
                MonthlyIncomeTarget * currentMonthDayLimit / daysInCurrentMonth
            );

            await using var transaction = await dbContext.Database.BeginTransactionAsync();

            // Keep the endpoint idempotent by replacing any prior seeded pocket.
            var existingSeedPockets = await dbContext.Pockets
                .Where(p => p.Name == SeedPocketName && p.Currency == "EUR")
                .ToListAsync();

            if (existingSeedPockets.Count > 0)
            {
                var existingPocketIds = existingSeedPockets.Select(p => p.Id).ToList();
                var existingTransactions = await dbContext.Transactions
                    .Where(t => existingPocketIds.Contains(t.PocketId))
                    .ToListAsync();

                if (existingTransactions.Count > 0)
                {
                    dbContext.Transactions.RemoveRange(existingTransactions);
                }

                dbContext.Pockets.RemoveRange(existingSeedPockets);
                await dbContext.SaveChangesAsync();
            }

            var pocket = new Pocket
            {
                Balance = SeedPocketInitialBalance,
                Currency = "EUR",
                Name = SeedPocketName,
                Iban = "IT60X0542811101000000123456"
            };

            dbContext.Pockets.Add(pocket);
            await dbContext.SaveChangesAsync();

            var random = new Random(now.Year * 100 + now.Month);
            var previousMonthTransactions = BuildMonthlyTransactions(
                pocket.Id,
                previousMonthDate.Year,
                previousMonthDate.Month,
                DateTime.DaysInMonth(previousMonthDate.Year, previousMonthDate.Month),
                MonthlyExpensesTarget,
                MonthlyIncomeTarget,
                random
            );

            var currentMonthTransactions = BuildMonthlyTransactions(
                pocket.Id,
                now.Year,
                now.Month,
                currentMonthDayLimit,
                currentMonthTarget,
                currentMonthIncomeTarget,
                random
            );

            var allTransactions = previousMonthTransactions
                .Concat(currentMonthTransactions)
                .OrderBy(t => t.Date)
                .ToList();

            dbContext.Transactions.AddRange(allTransactions);

            var totalNetFlow = allTransactions.Sum(t => t.Amount);
            pocket.Balance = RoundToCents(SeedPocketInitialBalance + totalNetFlow);

            await dbContext.SaveChangesAsync();
            await transaction.CommitAsync();

            return new SeedTwoMonthHistoryResponse
            {
                PocketId = pocket.Id,
                PocketName = pocket.Name,
                InitialBalance = SeedPocketInitialBalance,
                PreviousMonthExpenses = MonthlyExpensesTarget,
                CurrentMonthExpensesToDate = currentMonthTarget,
                RemainingToCurrentMonthTarget = RoundToCents(MonthlyExpensesTarget - currentMonthTarget),
                PreviousMonthIncome = MonthlyIncomeTarget,
                CurrentMonthIncomeToDate = currentMonthIncomeTarget,
                NetFlowToDate = RoundToCents(currentMonthIncomeTarget - currentMonthTarget),
                TotalTransactionsCreated = allTransactions.Count,
                CurrentBalance = pocket.Balance
            };
        });

        return Ok(result);
    }

    private static List<Transaction> BuildMonthlyTransactions(
        int pocketId,
        int year,
        int month,
        int dayLimit,
        decimal expenseTargetTotal,
        decimal incomeTargetTotal,
        Random random)
    {
        if (dayLimit <= 0)
        {
            return [];
        }

        var expenseDescriptionsByCategory = new Dictionary<TransactionCategory, string[]>
        {
            [TransactionCategory.Coffe] = ["Morning coffee", "Cafe stop", "Coffee break"],
            [TransactionCategory.Food] = ["Groceries", "Lunch", "Dinner"],
            [TransactionCategory.Transport] = ["Fuel", "Public transport", "Parking"],
            [TransactionCategory.Entertainment] = ["Cinema", "Streaming", "Weekend activity"],
            [TransactionCategory.Utilities] = ["Electric bill", "Internet bill", "Phone bill"],
            [TransactionCategory.Shopping] = ["Online order", "Clothes", "Home supplies"],
            [TransactionCategory.Health] = ["Pharmacy", "Medical visit", "Supplements"],
            [TransactionCategory.Sports] = ["Gym", "Sports gear", "Fitness class"],
            [TransactionCategory.Other] = ["Pharmacy", "Household items", "Misc purchase"]
        };

        var incomeDescriptionsByCategory = new Dictionary<TransactionCategory, string[]>
        {
            [TransactionCategory.Salary] = ["Monthly salary", "Payroll", "Payslip"],
            [TransactionCategory.Bonus] = ["Performance bonus", "Reward", "Quarter bonus"],
            [TransactionCategory.Freelance] = ["Client invoice", "Freelance gig", "Consulting"],
            [TransactionCategory.Business] = ["Business sale", "Project income", "Service revenue"],
            [TransactionCategory.Interest] = ["Bank interest", "Savings interest", "Yield"],
            [TransactionCategory.Dividends] = ["Stock dividend", "ETF dividend", "Broker payout"],
            [TransactionCategory.RentalIncome] = ["Rent received", "Property rent", "Tenant payment"],
            [TransactionCategory.Refund] = ["Order refund", "Chargeback", "Returned item refund"]
        };

        var expenseCategories = new[]
        {
            TransactionCategory.Food,
            TransactionCategory.Food,
            TransactionCategory.Transport,
            TransactionCategory.Coffe,
            TransactionCategory.Entertainment,
            TransactionCategory.Utilities,
            TransactionCategory.Shopping,
            TransactionCategory.Health,
            TransactionCategory.Sports,
            TransactionCategory.Other,
        };

        var incomeCategories = new[]
        {
            TransactionCategory.Salary,
            TransactionCategory.Bonus,
            TransactionCategory.Freelance,
            TransactionCategory.Business,
            TransactionCategory.Interest,
            TransactionCategory.Dividends,
            TransactionCategory.RentalIncome,
            TransactionCategory.Refund,
        };

        var expenseTransactions = BuildTransactionsForFlow(
            pocketId,
            year,
            month,
            dayLimit,
            expenseTargetTotal,
            Math.Max(8, dayLimit / 2),
            expenseCategories,
            expenseDescriptionsByCategory,
            random,
            isExpense: true
        );

        var incomeTransactions = BuildTransactionsForFlow(
            pocketId,
            year,
            month,
            dayLimit,
            incomeTargetTotal,
            Math.Max(3, dayLimit / 8),
            incomeCategories,
            incomeDescriptionsByCategory,
            random,
            isExpense: false
        );

        return expenseTransactions
            .Concat(incomeTransactions)
            .OrderBy(t => t.Date)
            .ToList();
    }

    private static List<Transaction> BuildTransactionsForFlow(
        int pocketId,
        int year,
        int month,
        int dayLimit,
        decimal targetTotal,
        int transactionCount,
        TransactionCategory[] categories,
        Dictionary<TransactionCategory, string[]> descriptionsByCategory,
        Random random,
        bool isExpense)
    {
        if (targetTotal <= 0 || transactionCount <= 0 || categories.Length == 0)
        {
            return [];
        }

        var centsByTransaction = DistributeCents(
            (int)Math.Round(targetTotal * 100m, MidpointRounding.AwayFromZero),
            transactionCount,
            random
        );

        var transactions = new List<Transaction>(transactionCount);

        for (var i = 0; i < transactionCount; i++)
        {
            var category = categories[random.Next(categories.Length)];
            var descriptions = descriptionsByCategory[category];
            var description = descriptions[random.Next(descriptions.Length)];

            var day = random.Next(1, dayLimit + 1);
            var hour = random.Next(8, 22);
            var minute = random.Next(0, 60);

            transactions.Add(new Transaction
            {
                PocketId = pocketId,
                Category = category,
                Description = description,
                Amount = isExpense ? -(centsByTransaction[i] / 100m) : centsByTransaction[i] / 100m,
                Date = DateTime.SpecifyKind(new DateTime(year, month, day, hour, minute, 0), DateTimeKind.Utc)
            });
        }

        return transactions;
    }

    private static List<int> DistributeCents(int totalCents, int count, Random random)
    {
        if (count <= 0)
        {
            return [];
        }

        var weights = Enumerable.Range(0, count)
            .Select(_ => random.Next(10, 100))
            .ToList();

        var weightSum = weights.Sum();
        var allocations = new List<int>(count);
        var allocated = 0;

        for (var i = 0; i < count; i++)
        {
            var value = (int)Math.Floor((decimal)totalCents * weights[i] / weightSum);
            allocations.Add(value);
            allocated += value;
        }

        var remainder = totalCents - allocated;
        for (var i = 0; i < remainder; i++)
        {
            allocations[i % allocations.Count] += 1;
        }

        return allocations;
    }

    private static decimal RoundToCents(decimal value)
    {
        return Math.Round(value, 2, MidpointRounding.AwayFromZero);
    }

    public class SeedTwoMonthHistoryResponse
    {
        public int PocketId { get; set; }
        public string PocketName { get; set; } = string.Empty;
        public decimal InitialBalance { get; set; }
        public decimal PreviousMonthExpenses { get; set; }
        public decimal CurrentMonthExpensesToDate { get; set; }
        public decimal RemainingToCurrentMonthTarget { get; set; }
        public decimal PreviousMonthIncome { get; set; }
        public decimal CurrentMonthIncomeToDate { get; set; }
        public decimal NetFlowToDate { get; set; }
        public int TotalTransactionsCreated { get; set; }
        public decimal CurrentBalance { get; set; }
    }
}
#endif
