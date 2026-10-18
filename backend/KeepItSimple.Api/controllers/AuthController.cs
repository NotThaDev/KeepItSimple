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
public class AuthController(UserManager<KeepItSimpleUser> userManager, SignInManager<KeepItSimpleUser> signInManager, TokenService tokenManager, IConfiguration configuration) : ControllerBase
{
    // A missing key means 182 days; 0 turns expiration off.
    private int PasswordExpirationDays => configuration.GetValue<int>("Identity:PasswordExpirationDays", 182);

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


        // Keyed by form field, so the frontend can mark the taken field; both are checked to report both at once.
        var conflicts = new Dictionary<string, string[]>();
        if (await userManager.FindByNameAsync(request.Username) != null)
        {
            conflicts["username"] = ["Username is already taken."];
        }

        if (await userManager.FindByEmailAsync(request.Email) != null)
        {
            conflicts["email"] = ["Email is already in use."];
        }

        if (conflicts.Count > 0)
        {
            return Conflict(new ValidationProblemDetails(conflicts) { Status = StatusCodes.Status409Conflict });
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

        var failure = await CheckPassword(user, request.Password);
        if (failure != null)
        {
            return failure;
        }

        // No tokens: the frontend turns the login form into a "set a new password" form.
        if (user.IsPasswordExpired(PasswordExpirationDays, DateTime.UtcNow))
        {
            return StatusCode(StatusCodes.Status403Forbidden);
        }

        var (refreshToken, _) = await RefreshToken.CreateAsync(user.Id, tokenManager.RefreshLifetime);
        return await BuildAuthResponse(user, refreshToken);
    }

    // Anonymous because an expired password gets no tokens; the current password proves who is asking.
    [HttpPost("change-expired-password")]
    [AllowAnonymous]
    public async Task<ActionResult> ChangeExpiredPassword([FromBody] ChangeExpiredPasswordRequest request)
    {
        var user = string.IsNullOrEmpty(request.Username) ? null : await userManager.FindByNameAsync(request.Username);
        if (user == null)
        {
            return Unauthorized();
        }

        var failure = await CheckPassword(user, request.CurrentPassword);
        if (failure != null)
        {
            return failure;
        }

        // Voluntary changes belong to the account page (#154), not this anonymous endpoint.
        if (!user.IsPasswordExpired(PasswordExpirationDays, DateTime.UtcNow))
        {
            return BadRequest("Password has not expired.");
        }

        if (request.NewPassword == request.CurrentPassword)
        {
            return BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]> { ["newPassword"] = ["Choose a password different from the current one."] }));
        }

        // Set before the change, so ChangePasswordAsync saves the password and its date in one write.
        user.PasswordChangedAt = DateTime.UtcNow;
        var changed = await userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!changed.Succeeded)
        {
            var errors = new Dictionary<string, string[]> { ["newPassword"] = changed.Errors.Select(e => e.Description).ToArray() };
            return BadRequest(new ValidationProblemDetails(errors));
        }

        // Sessions opened with the old password end here.
        await RefreshToken.RevokeAllAsync(user.Id);

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
        // An expired password ends the session too, so active users also get sent to the login form.
        if (user == null || user.IsPasswordExpired(PasswordExpirationDays, DateTime.UtcNow))
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

    // Shared by login and change-expired-password so both count failed attempts toward the same lockout.
    private async Task<ActionResult?> CheckPassword(KeepItSimpleUser user, string password)
    {
        var result = await signInManager.CheckPasswordSignInAsync(user, password, lockoutOnFailure: true);
        if (result.IsLockedOut)
        {
            var lockoutEnd = await userManager.GetLockoutEndDateAsync(user);
            var remaining = lockoutEnd.HasValue ? lockoutEnd.Value - DateTimeOffset.UtcNow : TimeSpan.Zero;
            return StatusCode(StatusCodes.Status423Locked, new LockoutResponse((int)Math.Ceiling(Math.Max(0, remaining.TotalSeconds))));
        }

        return result.Succeeded ? null : Unauthorized();
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