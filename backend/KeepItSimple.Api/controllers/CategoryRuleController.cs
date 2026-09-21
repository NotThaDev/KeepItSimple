using KeepItSimple.Api.dtos.CategoryRule;
using KeepItSimple.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace KeepItSimple.Api.Controllers;

[ApiController]
[Route("api/category-rules")]
public class CategoryRuleController : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CategoryRule>>> GetAll()
    {
        return Ok(await CategoryRule.GetAllAsync());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CategoryRule>> GetById(int id)
    {
        var rule = await CategoryRule.GetByIdAsync(id);
        if (rule is null)
        {
            return NotFound();
        }

        return Ok(rule);
    }

    [HttpPost]
    public async Task<ActionResult<CategoryRule>> Create([FromBody] CategoryRule rule)
    {
        if (rule.Id != 0)
        {
            return BadRequest("New rule should not have an ID.");
        }

        try
        {
            var created = await CategoryRule.CreateAsync(rule);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<CategoryRule>> Update(int id, [FromBody] CategoryRule rule)
    {
        rule.Id = id;
        try
        {
            var updated = await CategoryRule.UpdateAsync(rule);
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
        var deleted = await CategoryRule.DeleteAsync(id);
        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }

    [HttpPut("reorder")]
    public async Task<IActionResult> Reorder([FromBody] ReorderCategoryRulesRequest request)
    {
        if (request.Ids.Count == 0)
        {
            return BadRequest("At least one id must be provided.");
        }

        await CategoryRule.ReorderAsync(request.Ids);
        return NoContent();
    }

    [HttpPost("preview-apply")]
    public async Task<ActionResult<IEnumerable<CategoryRuleApplyPreviewItem>>> PreviewApply(
        [FromBody] PreviewApplyRequest? request)
    {
        var changes = await CategoryRule.PreviewApplyAsync(request);
        return Ok(changes);
    }

    [HttpPost("apply")]
    public async Task<ActionResult<ApplyCategoryRulesResponse>> Apply(
        [FromBody] ApplyCategoryRulesRequest request)
    {
        if (request.TransactionIds.Count == 0)
        {
            return BadRequest("At least one transaction id must be provided.");
        }

        var updatedCount = await CategoryRule.ApplyAsync(request.TransactionIds);
        return Ok(new ApplyCategoryRulesResponse { UpdatedCount = updatedCount });
    }
}
