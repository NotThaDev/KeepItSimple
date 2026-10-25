using KeepItSimple.Api.Helpers;
using KeepItSimple.Api.Models.Auth;
using Microsoft.AspNetCore.Mvc;

namespace KeepItSimple.Api.Controllers;

[ApiController]
[Route("api/account")]
public class AccountController : ControllerBase
{
    [HttpGet("picture")]
    public async Task<ActionResult> GetPicture()
    {
        var picture = await ProfilePicture.GetAsync(User.GetUserId());
        if (picture == null)
        {
            return NotFound();
        }

        // The URL carries the picture version, so the browser can keep it until it changes.
        Response.Headers.CacheControl = "private, max-age=31536000, immutable";
        return File(picture.Data, picture.ContentType);
    }

    [HttpPut("picture")]
    // A little above MaxBytes for the multipart framing.
    [RequestSizeLimit(ProfilePicture.MaxBytes + 64 * 1024)]
    public async Task<ActionResult> UploadPicture([FromForm] IFormFile? file)
    {
        if (file == null || file.Length == 0)
        {
            return PictureError("Choose an image to upload.");
        }

        if (file.Length > ProfilePicture.MaxBytes)
        {
            return PictureError("The image must be 1 MB or smaller.");
        }

        using var stream = new MemoryStream();
        await file.CopyToAsync(stream);
        var data = stream.ToArray();
        var contentType = ProfilePicture.DetectContentType(data);
        if (contentType == null)
        {
            return PictureError("Use a PNG, JPEG or WebP image.");
        }

        await ProfilePicture.SaveAsync(User.GetUserId(), contentType, data);
        return NoContent();
    }

    [HttpDelete("picture")]
    public async Task<ActionResult> DeletePicture()
    {
        await ProfilePicture.DeleteAsync(User.GetUserId());
        return NoContent();
    }

    private BadRequestObjectResult PictureError(string message) =>
        BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]> { ["file"] = [message] }));
}
