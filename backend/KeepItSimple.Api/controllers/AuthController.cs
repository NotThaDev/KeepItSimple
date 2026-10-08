using KeepItSimple.Api.Dtos.Auth;
using KeepItSimple.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace KeepItSimple.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(UserManager<KeepItSimpleUser> userManager, SignInManager<KeepItSimpleUser> signInManager) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<KeepItSimpleUser>> Register([FromBody] RegisterRequest request)
    {
        var user = new KeepItSimpleUser
        {
            UserName = request.Username,
            Email = request.Email,
        };

        if (string.IsNullOrEmpty(request.Username) && string.IsNullOrEmpty(request.Email))
        {
            return BadRequest("Username or email is required.");
        }

        if (!string.IsNullOrEmpty(request.Username))
        {
            var userExists = await userManager.FindByNameAsync(request.Username);
            if (userExists == null)
            {
                return BadRequest("Username already exists.");
            }
        }

        if (!string.IsNullOrEmpty(request.Email))
        {
            var userExists = await userManager.FindByEmailAsync(request.Email);
            if (userExists != null)
            {
                return BadRequest("Email already exists.");
            }
        }

        await userManager.CreateAsync(user, request.Password);
        return Ok(user);
    }

    [HttpPost("login")]
    public async Task<ActionResult<Pocket>> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrEmpty(request.Username) && string.IsNullOrEmpty(request.Email))
        {
            return BadRequest("Username or email is required.");
        }

        KeepItSimpleUser? user = null;
        if (!string.IsNullOrEmpty(request.Username))
        {
            user = await userManager.FindByNameAsync(request.Username);
        }
        else if (!string.IsNullOrEmpty(request.Email))
        {
            user = await userManager.FindByEmailAsync(request.Email);
        }

        if (user == null)
        {
            return Unauthorized();
        }

        var result = await signInManager.CheckPasswordSignInAsync(user, request.Password, false);
        if (!result.Succeeded)
        {
            return Unauthorized();
        }

        return Ok(user);
    }

    [HttpGet("me")]
    public async Task<ActionResult<KeepItSimpleUser>> Me()
    {
        var user = await userManager.GetUserAsync(HttpContext.User);
        if (user == null)
        {
            return Unauthorized();
        }
        return Ok(user);
    }

    [HttpPost("logout")]
    public async Task<ActionResult> Logout()
    {
        await signInManager.SignOutAsync();
        return Ok();
    }

    // Here we need to define all the endpoits to refresh the token, password reset, etc.
}