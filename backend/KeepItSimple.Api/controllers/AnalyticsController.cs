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
        var overview = await GetOverviewAsync();

        return Ok(overview);
    }

    [HttpGet("income")]
    public async Task<ActionResult<IncomeAnalytics>> GetIncome()
    {
        var income = await GetIncomeAnalyticsAsync();

        return Ok(income);
    }
}
