using KeepItSimple.Api.Dtos.Notification;
using KeepItSimple.Api.Helpers;
using KeepItSimple.Api.Models.Notifications;
using Microsoft.AspNetCore.Mvc;

namespace KeepItSimple.Api.Controllers;

[ApiController]
[Route("api/notifications")]
public class NotificationController : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<InAppNotification>>> List([FromQuery] bool read = false)
    {
        return Ok(await InAppNotification.ListAsync(read, User.GetUserId()));
    }

    [HttpGet("unread-summary")]
    public async Task<ActionResult<UnreadSummaryResponse>> UnreadSummary()
    {
        return Ok(await InAppNotification.GetUnreadSummaryAsync(User.GetUserId()));
    }

    [HttpPost("{id:int}/read")]
    public async Task<ActionResult> MarkRead(int id)
    {
        if (!await InAppNotification.MarkReadAsync(id, User.GetUserId()))
        {
            return NotFound();
        }
        return NoContent();
    }

    [HttpGet("settings/import-reminder")]
    public async Task<ActionResult<ImportReminderSetting>> GetImportReminder()
    {
        return Ok(await ImportReminderSetting.GetAsync(User.GetUserId()) ?? new ImportReminderSetting());
    }

    [HttpPut("settings/import-reminder")]
    public async Task<ActionResult<ImportReminderSetting>> SaveImportReminder([FromBody] ImportReminderSetting setting)
    {
        try
        {
            return Ok(await ImportReminderSetting.UpsertAsync(setting, User.GetUserId()));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
