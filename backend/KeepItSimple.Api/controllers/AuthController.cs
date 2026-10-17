using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using KeepItSimple.Api.Dtos.Auth;
using KeepItSimple.Api.Models;
using KeepItSimple.Api.Models.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace KeepItSimple.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(UserManager<KeepItSimpleUser> userManager, SignInManager<KeepItSimpleUser> signInManager, TokenService tokenManager) : ControllerBase
{
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult> Register([FromBody] RegisterRequest request)
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

        return Ok();
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult> Login([FromBody] LoginRequest request)
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

        var (refreshToken, _) = await RefreshToken.CreateAsync(user.Id, tokenManager.RefreshLifetime);
        return await BuildAuthResponse(user, refreshToken);
    }

    // Anonymous because it runs when the access token has expired.
    // The refresh token comes from the HttpOnly cookie, never the body, so page scripts can't read or steal it.
    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<ActionResult> Refresh()
    {
        if (!Request.Cookies.TryGetValue(RefreshToken.CookieName, out var token) || string.IsNullOrEmpty(token))
        {
            return Unauthorized();
        }

        var rotated = await RefreshToken.RotateAsync(token, tokenManager.RefreshLifetime);
        var user = rotated == null ? null : await userManager.FindByIdAsync(rotated.Value.UserId);
        if (user == null)
        {
            ClearAuthCookies();
            return Unauthorized();
        }

        return await BuildAuthResponse(user, rotated!.Value.Token);
    }

    [HttpGet("me")]
    public async Task<ActionResult<UserResponse>> Me()
    {
        // MapInboundClaims = false keeps the JWT's "sub" claim name as is.
        var userId = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        var user = userId == null ? null : await userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return Unauthorized();
        }

        return Ok(new UserResponse(user.Id, user.UserName, user.Email));
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    public async Task<ActionResult> Logout()
    {
        if (Request.Cookies.TryGetValue(RefreshToken.CookieName, out var token) && !string.IsNullOrEmpty(token))
        {
            await RefreshToken.RevokeAsync(token);
        }

        ClearAuthCookies();
        return NoContent();
    }

    // Both tokens travel as HttpOnly cookies, so page scripts never see them; the response has no body.
    private async Task<ActionResult> BuildAuthResponse(KeepItSimpleUser user, string refreshToken)
    {
        var roles = await userManager.GetRolesAsync(user);
        var (accessToken, _) = tokenManager.CreateToken(user, roles);
        // The access cookie goes away 30s before the JWT expires, so the proxy refreshes before the API would reject it.
        Response.Cookies.Append(TokenService.AccessCookieName, accessToken, tokenManager.AuthCookieOptions(Request.IsHttps, tokenManager.AccessLifetime - TimeSpan.FromSeconds(30)));
        Response.Cookies.Append(RefreshToken.CookieName, refreshToken, tokenManager.AuthCookieOptions(Request.IsHttps, tokenManager.RefreshLifetime));
        return NoContent();
    }

    private void ClearAuthCookies()
    {
        Response.Cookies.Delete(TokenService.AccessCookieName, tokenManager.AuthCookieOptions(Request.IsHttps));
        Response.Cookies.Delete(RefreshToken.CookieName, tokenManager.AuthCookieOptions(Request.IsHttps));
    }
}