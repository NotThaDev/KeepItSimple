using System.Security.Cryptography;
using System.Text;
using KeepItSimple.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KeepItSimple.Api.Controllers;

[ApiController]
[Route("api/maintenance")]
public class MaintenanceController(IConfiguration configuration) : ControllerBase
{
    // One-time job run by the operator with a shared key (Backfill:Key), not by a signed-in user.
    [AllowAnonymous]
    [HttpPost("backfill-rule-categories")]
    public async Task<IActionResult> BackfillRuleCategories()
    {
        var key = configuration["Backfill:Key"];
        if (string.IsNullOrEmpty(key))
        {
            return NotFound();
        }

        var sent = Request.Headers["X-Backfill-Key"].ToString();
        if (!CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(sent), Encoding.UTF8.GetBytes(key)))
        {
            return Unauthorized();
        }

        var (scanned, updated) = await CategoryRule.BackfillConditionIdsAsync();
        return Ok(new { scanned, updated });
    }
}
