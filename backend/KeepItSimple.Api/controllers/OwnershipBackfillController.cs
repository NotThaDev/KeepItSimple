using KeepItSimple.Api.dtos.Ownership;
using KeepItSimple.Api.Helpers;
using KeepItSimple.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace KeepItSimple.Api.Controllers;

// shortcut: one-off endpoint for data created before pockets and rules had an owner; removed with the migration that makes UserId required.
[ApiController]
[Route("api/backfill")]
public class OwnershipBackfillController(UserManager<KeepItSimpleUser> userManager) : ControllerBase
{
    // Registration is public: without this check, anyone who signs up first could claim all existing data.
    private const string BackfillOwnerUserName = "ThaSurname";

    [HttpPost("owner")]
    public async Task<ActionResult<OwnerBackfillResponse>> AssignOwner()
    {
        var userId = User.GetUserId();
        var user = await userManager.FindByIdAsync(userId);
        if (!string.Equals(user?.UserName, BackfillOwnerUserName, StringComparison.OrdinalIgnoreCase))
        {
            return Forbid();
        }

        return Ok(new OwnerBackfillResponse
        {
            Pockets = await Pocket.AssignUnownedAsync(userId),
            CategoryRules = await CategoryRule.AssignUnownedAsync(userId),
        });
    }
}
