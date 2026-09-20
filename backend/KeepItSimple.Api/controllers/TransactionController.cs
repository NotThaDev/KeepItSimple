using KeepItSimple.Api.dtos.Transaction;
using KeepItSimple.Api.Helpers;
using KeepItSimple.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace KeepItSimple.Api.Controllers;

[ApiController]
[Route("api/transactions")]
public class TransactionController : ControllerBase
{
    private static readonly string[] ImportSupportedExtensions = [".xls", ".xlsx", ".xlsm", ".csv"];

    [HttpGet]
    public async Task<ActionResult<PagedTransactionsResponse>> GetAll(
        [FromQuery] TransactionListQuery query)
    {
        var transactions = await Transaction.GetPagedAsync(query);
        return Ok(transactions);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Transaction>> GetById(int id)
    {
        var transaction = await Transaction.GetByIdAsync(id);
        if (transaction == null)
        {
            return NotFound();
        }
        return Ok(transaction);
    }

    [HttpPost]
    public async Task<ActionResult<Transaction>> Create([FromBody] Transaction transaction)
    {
        if (transaction.Id.HasValue)
        {
            return BadRequest("New transaction should not have an ID.");
        }

        var createdTransaction = await Transaction.Update(transaction);
        // On create this will not happen
        if (createdTransaction == null)
        {
            return BadRequest();
        }

        return CreatedAtAction(nameof(GetById), new { id = createdTransaction.Id }, createdTransaction);
    }

    [HttpPost("transfer")]
    public async Task<ActionResult<TransferResponse>> CreateTransfer([FromBody] TransferRequest request)
    {
        if (request.FromPocketId == request.ToPocketId)
        {
            return BadRequest("Source and destination pockets must be different.");
        }

        if (request.Amount <= 0)
        {
            return BadRequest("Amount must be greater than zero.");
        }

        var transfer = await Transaction.CreateTransfer(
            request.FromPocketId,
            request.ToPocketId,
            request.Amount,
            request.Date,
            request.Description);

        if (transfer == null)
        {
            return BadRequest("Unable to create the transfer. Check that both pockets exist.");
        }

        return Ok(new TransferResponse
        {
            Outgoing = transfer.Value.Outgoing,
            Incoming = transfer.Value.Incoming,
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Transaction transaction)
    {
        transaction.Id = id; // Ensure the ID is set to the URL parameter
        var updatedTransaction = await Transaction.Update(transaction);
        if (updatedTransaction == null)
        {
            return NotFound();
        }

        return Ok(updatedTransaction);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await Transaction.Delete([id]);
        if (!deleted)
        {
            return NotFound();
        }
        return NoContent();
    }

    [HttpDelete()]
    public async Task<IActionResult> BulkDelete([FromQuery] int[] ids)
    {
        if (ids.Length == 0)
        {
            return BadRequest("At least one id must be provided.");
        }

        var deleted = await Transaction.Delete([.. ids]);
        if (!deleted)
        {
            return NotFound();
        }
        return NoContent();
    }

    [HttpGet("pocket/{pocketId}")]
    public async Task<ActionResult<IEnumerable<Transaction>>> GetByPocketId(int pocketId)
    {
        var transactions = await Transaction.GetByPocketIdAsync(pocketId);
        return Ok(transactions);
    }

    [HttpPost("import/analyze")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public ActionResult<AnalyzeResponse> AnalyzeImport(IFormFile file)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest("A file is required.");
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!ImportSupportedExtensions.Contains(extension))
        {
            return BadRequest("Only .xls, .xlsx and .csv files are supported.");
        }

        try
        {
            using var stream = file.OpenReadStream();
            var result = TransactionImporter.Analyze(stream);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("import/preview")]
    public ActionResult<PreviewResponse> PreviewImport(
        [FromBody] PreviewRequest request)
    {
        try
        {
            var result = TransactionImporter.Preview(request);
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

    [HttpPost("import/confirm")]
    public async Task<ActionResult<ConfirmResponse>> ConfirmImport(
        [FromBody] ConfirmRequest request)
    {
        if (request.Transactions.Count == 0)
        {
            return BadRequest("No transactions to save.");
        }

        try
        {
            var result = await TransactionImporter.Confirm(request);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }
}