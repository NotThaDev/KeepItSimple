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
    public async Task<ActionResult<UserResponse>> Register([FromBody] RegisterRequest request)
    {
        var user = new KeepItSimpleUser
        {
            UserName = request.Username,
            Email = request.Email,
        };

        if (string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Email))
        {
            return BadRequest("Username or email is required.");
        }


        var userExists = await userManager.FindByNameAsync(request.Username);
        if (userExists != null)
        {
            return BadRequest("Username already exists.");
        }


        userExists = await userManager.FindByEmailAsync(request.Email);
        if (userExists != null)
        {
            return BadRequest("Email already exists.");
        }

        var userCreationResult = await userManager.CreateAsync(user, request.Password);
        if (!userCreationResult.Succeeded)
        {
            return BadRequest("Failed to create user.");
        }

        return Ok(new UserResponse(user.Id, user.UserName, user.Email));
    }

    [HttpPost("login")]
    public async Task<ActionResult<UserResponse>> Login([FromBody] LoginRequest request)
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

        var result = await signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);
        if (!result.Succeeded)
        {
            return Unauthorized();
        }

        return Ok(new UserResponse(user.Id, user.UserName, user.Email));
    }

    [HttpGet("me")]
    public async Task<ActionResult<UserResponse>> Me()
    {
        // This will be implemented later when we have a proper authentication mechanism in place (like JWT tokens).
        throw new NotImplementedException();
    }

    [HttpPost("logout")]
    public async Task<ActionResult> Logout()
    {
        // This will be implemented later when we have a proper authentication mechanism in place (like JWT tokens).
        throw new NotImplementedException();
    }

    // Here we need to define all the endpoits to refresh the token, password reset, etc.
}