using KeepItSimple.Api.Helpers;
using KeepItSimple.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace KeepItSimple.Api.Controllers;

[ApiController]
[Route("api/import-mappings")]
public class ImportMappingController : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ImportMapping>>> GetAll()
    {
        return Ok(await ImportMapping.GetAllAsync(User.GetUserId()));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ImportMapping>> GetById(int id)
    {
        var mapping = await ImportMapping.GetByIdAsync(id, User.GetUserId());
        if (mapping is null)
        {
            return NotFound();
        }

        return Ok(mapping);
    }

    [HttpPost]
    public async Task<ActionResult<ImportMapping>> Create([FromBody] ImportMapping mapping)
    {
        if (mapping.Id != 0)
        {
            return BadRequest("New mapping should not have an ID.");
        }

        try
        {
            var created = await ImportMapping.CreateAsync(mapping, User.GetUserId());
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ex.Message);
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ImportMapping>> Update(int id, [FromBody] ImportMapping mapping)
    {
        mapping.Id = id;
        try
        {
            var updated = await ImportMapping.UpdateAsync(mapping, User.GetUserId());
            if (updated is null)
            {
                return NotFound();
            }

            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ex.Message);
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await ImportMapping.DeleteAsync(id, User.GetUserId());
        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }
}
