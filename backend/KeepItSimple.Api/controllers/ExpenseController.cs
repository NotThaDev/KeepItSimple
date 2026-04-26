using KeepItSimple.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace KeepItSimple.Api.Controllers;

[ApiController]
[Route("api/expenses")]
public class ExpenseController : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Expense>>> GetAll()
    {
        var expenses = await Expense.GetAllAsync();
        return Ok(expenses);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Expense>> GetById(int id)
    {
        var expense = await Expense.GetByIdAsync(id);
        if (expense == null)
        {
            return NotFound();
        }
        return Ok(expense);
    }

    [HttpPost]
    public async Task<ActionResult<Expense>> Create([FromBody] Expense expense)
    {
        if (expense.Id.HasValue)
        {
            return BadRequest("New expense should not have an ID.");
        }

        var createdExpense = await Expense.Update(expense);
        // On create this will not happen
        if (createdExpense == null)
        {
            return BadRequest();
        }

        return CreatedAtAction(nameof(GetById), new { id = createdExpense.Id }, createdExpense);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Expense expense)
    {
        expense.Id = id; // Ensure the ID is set to the URL parameter
        var updatedExpense = await Expense.Update(expense);
        if (updatedExpense == null)
        {
            return NotFound();
        }

        return Ok(updatedExpense);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await Expense.Delete(id);
        if (!deleted)
        {
            return NotFound();
        }
        return NoContent();
    }
}