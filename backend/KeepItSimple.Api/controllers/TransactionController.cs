using KeepItSimple.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace KeepItSimple.Api.Controllers;

[ApiController]
[Route("api/transactions")]
public class TransactionController : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Transaction>>> GetAll()
    {
        var transaction = await Transaction.GetAllAsync();
        return Ok(transaction);
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
        var deleted = await Transaction.Delete(id);
        if (!deleted)
        {
            return NotFound();
        }
        return NoContent();
    }
}