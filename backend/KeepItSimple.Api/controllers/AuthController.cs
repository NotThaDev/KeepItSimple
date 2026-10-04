using KeepItSimple.Api.Dtos.Auth;
using KeepItSimple.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace KeepItSimple.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<KeepItSimpleUser>> Register([FromBody] RegisterRequest request)
    {
        throw new NotImplementedException();
    }

    [HttpPost("login")]
    public async Task<ActionResult<Pocket>> Login([FromBody] LoginRequest request)
    {
        throw new NotImplementedException();
    }

    [HttpGet("me")]
    public async Task<ActionResult<KeepItSimpleUser>> Me()
    {
        throw new NotImplementedException();
    }

    [HttpPost("logout")]
    public async Task<ActionResult> Logout()
    {
        throw new NotImplementedException();
    }

    // Here in the future we will define the endpoints for token refresh, etc.
}