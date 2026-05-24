using KeepItSimple.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace KeepItSimple.Api.Controllers;

[ApiController]
[Route("api/pocket")]
public class PocketController : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Pocket>>> GetAll()
    {
        var pockets = await Pocket.GetAllAsync();
        return Ok(pockets);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Pocket>> GetById(int id)
    {
        var pocket = await Pocket.GetByIdAsync(id);
        if (pocket == null)
        {
            return NotFound();
        }
        return Ok(pocket);
    }

    [HttpPost]
    public async Task<ActionResult<Pocket>> Create([FromBody] Pocket pocket)
    {
        if (pocket.Id != 0)
        {
            return BadRequest("New pocket should not have an ID.");
        }

        var createdPocket = await Pocket.Update(pocket);
        // On create this will not happen
        if (createdPocket == null)
        {
            return BadRequest();
        }

        return CreatedAtAction(nameof(GetById), new { id = createdPocket.Id }, createdPocket);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Pocket pocket)
    {
        pocket.Id = id; // Ensure the ID is set to the URL parameter
        var updatedPocket = await Pocket.Update(pocket);
        if (updatedPocket == null)
        {
            return NotFound();
        }

        return Ok(updatedPocket);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await Pocket.Delete(id);
        if (!deleted)
        {
            return NotFound();
        }
        return NoContent();
    }
}