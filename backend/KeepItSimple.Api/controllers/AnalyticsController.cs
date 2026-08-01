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
}