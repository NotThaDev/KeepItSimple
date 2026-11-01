using KeepItSimple.Api.dtos.Report;
using KeepItSimple.Api.Helpers;
using Microsoft.AspNetCore.Mvc;
using ReportEntity = KeepItSimple.Api.Models.Reports.Report;

namespace KeepItSimple.Api.Controllers;

[ApiController]
[Route("api/reports")]
public class ReportController : ControllerBase
{
    private const string XlsxContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    [HttpGet]
    public async Task<ActionResult<List<ReportEntity>>> GetAll()
    {
        return Ok(await ReportEntity.GetAllAsync(User.GetUserId()));
    }

    [HttpPost]
    public async Task<ActionResult<ReportEntity>> Create([FromBody] CreateReportRequest request)
    {
        if (!Enum.IsDefined(request.Period))
        {
            return BadRequest("Unknown report period.");
        }

        var userId = User.GetUserId();
        if (await ReportEntity.CountAsync(userId) >= ReportEntity.MaxPerUser)
        {
            return BadRequest($"You can keep up to {ReportEntity.MaxPerUser} reports. Delete old reports first.");
        }

        var report = await ReportEntity.CreateAsync(request.Period, userId, DateTime.UtcNow);
        return CreatedAtAction(nameof(Download), new { id = report.Id }, report);
    }

    [HttpGet("{id}/download")]
    public async Task<IActionResult> Download(int id)
    {
        var report = await ReportEntity.GetFileAsync(id, User.GetUserId());
        if (report == null)
        {
            return NotFound();
        }

        return File(report.Data, XlsxContentType, report.FileName);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        return await ReportEntity.DeleteAsync(id, User.GetUserId()) ? NoContent() : NotFound();
    }
}
