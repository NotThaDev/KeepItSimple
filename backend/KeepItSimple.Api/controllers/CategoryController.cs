using KeepItSimple.Api.dtos.Category;
using KeepItSimple.Api.Helpers;
using KeepItSimple.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace KeepItSimple.Api.Controllers;

[ApiController]
[Route("api/categories")]
public class CategoryController : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Category>>> GetAll()
    {
        return Ok(await Category.GetVisibleAsync(User.GetUserId()));
    }

    [HttpGet("{id}/usage")]
    public async Task<ActionResult<CategoryUsageResponse>> GetUsage(int id)
    {
        var usage = await Category.GetUsageAsync(id, User.GetUserId());
        if (usage is null)
        {
            return NotFound();
        }

        return Ok(usage);
    }

    [HttpPost]
    public async Task<ActionResult<Category>> Create([FromBody] Category category)
    {
        if (category.Id != 0)
        {
            return BadRequest("New category should not have an ID.");
        }

        try
        {
            var created = await Category.CreateAsync(category, User.GetUserId());
            return Created($"/api/categories/{created.Id}", created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Category>> Update(int id, [FromBody] Category category)
    {
        category.Id = id;
        try
        {
            var updated = await Category.UpdateAsync(category, User.GetUserId());
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
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await Category.DeleteAsync(id, User.GetUserId());
        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }
}
