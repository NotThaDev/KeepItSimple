using KeepItSimple.Api.Helpers;
using KeepItSimple.Api.Models.Analytics;
using Microsoft.AspNetCore.Mvc;
using static KeepItSimple.Api.Models.Analytics.Analytics;

namespace KeepItSimple.Api.Controllers;

[ApiController]
[Route("api/analytics")]
public class AnalyticsController : ControllerBase
{
    [HttpGet("overview")]
    public async Task<ActionResult<OverviewAnalytics>> GetOverview()
    {
        var overview = await GetOverviewAsync(User.GetUserId());

        return Ok(overview);
    }

    [HttpGet("income")]
    public async Task<ActionResult<IncomeAnalytics>> GetIncome([FromQuery] int? month)
    {
        var income = await GetIncomeAnalyticsAsync(User.GetUserId(), month: month);

        return Ok(income);
    }

    [HttpGet("expense")]
    public async Task<ActionResult<ExpenseAnalytics>> GetExpense([FromQuery] int? month)
    {
        var expense = await GetExpensesAnalyticsAsync(User.GetUserId(), month: month);

        return Ok(expense);
    }

    [HttpGet("saving")]
    public async Task<ActionResult<SavingAnalytics>> GetSaving([FromQuery] int? month)
    {
        var saving = await GetSavingsAnalyticsAsync(User.GetUserId(), month);

        return Ok(saving);
    }
}
