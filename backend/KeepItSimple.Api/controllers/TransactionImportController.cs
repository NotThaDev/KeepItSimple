using KeepItSimple.Api.Helpers;
using Microsoft.AspNetCore.Mvc;

namespace KeepItSimple.Api.Controllers;

[ApiController]
[Route("api/transactions/import")]
public class TransactionImportController : ControllerBase
{
    /// <summary>
    /// Step 1 – Upload a file (.xls / .xlsx / .csv). Returns discovered columns + sample rows
    /// so the UI can let the user map each column to a Transaction field (or Ignore).
    /// </summary>
    [HttpPost("analyze")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public ActionResult<TransactionImport.AnalyzeResponse> Analyze(IFormFile file)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest("A file is required.");
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension is not ".xls" and not ".xlsx" and not ".xlsm" and not ".csv")
        {
            return BadRequest("Only .xls, .xlsx and .csv files are supported.");
        }

        try
        {
            using var stream = file.OpenReadStream();
            var result = TransactionImport.Analyze(stream, file.FileName);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    /// <summary>
    /// Step 2 – Apply the user column mapping and return draft transactions for confirmation.
    /// </summary>
    [HttpPost("preview")]
    public ActionResult<TransactionImport.PreviewResponse> Preview(
        [FromBody] TransactionImport.PreviewRequest request)
    {
        try
        {
            var result = TransactionImport.Preview(request);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    /// <summary>
    /// Step 3 – Persist the (possibly user-edited) draft transactions.
    /// </summary>
    [HttpPost("confirm")]
    public async Task<ActionResult<TransactionImport.ConfirmResponse>> Confirm(
        [FromBody] TransactionImport.ConfirmRequest request)
    {
        if (request.Transactions.Count == 0)
        {
            return BadRequest("No transactions to save.");
        }

        try
        {
            var result = await TransactionImport.Confirm(request);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }
}
