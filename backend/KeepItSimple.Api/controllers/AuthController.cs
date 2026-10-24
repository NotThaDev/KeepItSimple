using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using KeepItSimple.Api.Dtos.Auth;
using KeepItSimple.Api.Models;
using KeepItSimple.Api.Models.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;
using KeepItSimple.Api.Models.Notifications;

namespace KeepItSimple.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(KeepItSimpleUserManager userManager, SignInManager<KeepItSimpleUser> signInManager, TokenService tokenManager, IOptions<FrontendSettings> frontendOptions) : ControllerBase
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

        await SendConfirmationEmail(user);
        return Ok();
    }

    [HttpPost("confirm-email")]
    [AllowAnonymous]
    public async Task<ActionResult> ConfirmEmail([FromBody] ConfirmEmailRequest request)
    {
        const string message = "Invalid or expired confirmation link.";
        var user = string.IsNullOrEmpty(request.UserId) ? null : await userManager.FindByIdAsync(request.UserId);
        if (user == null)
        {
            return BadRequest(message);
        }

        // Idempotent: the page may post twice (React StrictMode, refresh).
        if (user.EmailConfirmed)
        {
            return NoContent();
        }

        string token;
        try
        {
            token = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(request.Token));
        }
        catch (FormatException)
        {
            return BadRequest(message);
        }

        var result = await userManager.ConfirmEmailAsync(user, token);
        return result.Succeeded ? NoContent() : BadRequest(message);
    }

    // Always 204, so the response does not reveal whether the account exists.
    [HttpPost("resend-confirmation")]
    [AllowAnonymous]
    public async Task<ActionResult> ResendConfirmation([FromBody] ResendConfirmationRequest request)
    {
        var user = string.IsNullOrEmpty(request.Username) ? null : await userManager.FindByNameAsync(request.Username);
        // One email per minute per user, so the endpoint cannot be used to flood an inbox.
        if (user != null && !user.EmailConfirmed && !await Notification.HasRecentAsync(user.Id, NotificationChannelType.Email, TimeSpan.FromMinutes(1)))
        {
            await SendConfirmationEmail(user);
        }

        return NoContent();
    }

    private async Task SendConfirmationEmail(KeepItSimpleUser user)
    {
        var token = await userManager.GenerateEmailConfirmationTokenAsync(user);
        // Identity tokens contain '+' and '/', so they are Base64Url-encoded for the query string.
        var encoded = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));
        var link = $"{frontendOptions.Value.BaseUrl.TrimEnd('/')}/confirm-email?userId={Uri.EscapeDataString(user.Id)}&token={encoded}";
        await NotificationManager.SendEmailConfirmationAsync(user, link);
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

        // Checked after the password, so a wrong password stays a plain 401 and keeps Identity's lockout counting.
        if (!user.EmailConfirmed)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new LoginErrorResponse("email_not_confirmed"));
        }

        // No tokens: the frontend turns the login form into a "set a new password" form.
        if (userManager.IsPasswordExpired(user))
        {
            return StatusCode(StatusCodes.Status403Forbidden);
        }

        var (refreshToken, _) = await RefreshToken.CreateAsync(user.Id, tokenManager.RefreshLifetime);
        return await BuildAuthResponse(user, refreshToken);
    }

    // Anonymous so an expired password (which gets no tokens) can be changed too; the current password proves who is asking.
    [HttpPost("change-password")]
    [AllowAnonymous]
    public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
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

        if (request.NewPassword == request.CurrentPassword)
        {
            return BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]> { ["newPassword"] = ["Choose a password different from the current one."] }));
        }

        var changed = await userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!changed.Succeeded)
        {
            var errors = new Dictionary<string, string[]> { ["newPassword"] = [.. changed.Errors.Select(e => e.Description)] };
            return BadRequest(new ValidationProblemDetails(errors));
        }

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
        if (user == null || userManager.IsPasswordExpired(user))
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