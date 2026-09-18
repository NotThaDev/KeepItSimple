using KeepItSimple.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace KeepItSimple.Api.Controllers;

[ApiController]
[Route("api/analytics")]
public class AnalyticsController : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult> Get()
    {
        var analytics = await Analytics.GetMonthlyAnalyticsAsync();

        return Ok(analytics);
    }

    [HttpGet("{kind}")]
    public async Task<ActionResult<Analytics.PeriodInsight>> GetByKind(
        AnalyticsKind kind,
        [FromQuery] AnalyticsTimeRange range = AnalyticsTimeRange.CurrentMonth)
    {
        var insight = await Analytics.GetPeriodAnalyticsAsync(kind, range);
        return Ok(insight);
    }
}
