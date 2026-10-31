using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using KeepItSimple.Api.Dtos.Auth;
using KeepItSimple.Api.Helpers;
using KeepItSimple.Api.Models.Auth;
using KeepItSimple.Api.Models.Notifications;
using KeepItSimple.Api.Models;
using KeepItSimple.Api.Settings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;

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

        var token = DecodeToken(request.Token);
        if (token == null)
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

    // Always 204, so the response does not reveal whether the email is registered.
    // shortcut: known and unknown emails differ in response time; add constant-time padding if enumeration matters.
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<ActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        var user = string.IsNullOrWhiteSpace(request.Email) ? null : await userManager.FindByEmailAsync(request.Email);
        // One email per minute per user, so the endpoint cannot be used to flood an inbox.
        if (user != null && !await Notification.HasRecentAsync(user.Id, NotificationChannelType.Email, TimeSpan.FromMinutes(1)))
        {
            var token = await userManager.GeneratePasswordResetTokenAsync(user);
            await NotificationManager.EnqueuePasswordForgotAsync(user, BuildLink("reset-password", user, token));
        }

        return NoContent();
    }

    // Anonymous because the user has no password to sign in with. The reset token is the proof of inbox ownership.
    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<ActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        const string message = "Invalid or expired reset link.";
        var user = string.IsNullOrEmpty(request.UserId) ? null : await userManager.FindByIdAsync(request.UserId);
        if (user == null)
        {
            return BadRequest(message);
        }

        var token = DecodeToken(request.Token);
        // Token first: otherwise the same-password check below would let anyone test passwords without lockout.
        if (token == null || !await userManager.VerifyUserTokenAsync(user, userManager.Options.Tokens.PasswordResetTokenProvider, UserManager<KeepItSimpleUser>.ResetPasswordTokenPurpose, token))
        {
            return BadRequest(message);
        }

        // Reusing the current password would restart the expiration clock without changing anything.
        if (await userManager.CheckPasswordAsync(user, request.NewPassword))
        {
            return BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]> { ["newPassword"] = ["Choose a password different from the current one."] }));
        }

        // A reset proves the user owns the inbox, so it also lifts a lockout and confirms the email; set here so it is saved in the same write as the password.
        user.AccessFailedCount = 0;
        user.LockoutEnd = null;
        user.EmailConfirmed = true;
        var result = await userManager.ResetPasswordAsync(user, token, request.NewPassword);
        if (!result.Succeeded)
        {
            var errors = new Dictionary<string, string[]> { ["newPassword"] = [.. result.Errors.Select(e => e.Description)] };
            return BadRequest(new ValidationProblemDetails(errors));
        }

        // Refresh tokens end now; access tokens already issued stop on their next request.
        await RefreshToken.RevokeAllAsync(user.Id);
        return NoContent();
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

        var (refreshToken, _, sessionId) = await RefreshToken.CreateAsync(user.Id, tokenManager.RefreshLifetime, UserAgent());
        return await BuildAuthResponse(user, refreshToken, sessionId);
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

        var (refreshToken, _, sessionId) = await RefreshToken.CreateAsync(user.Id, tokenManager.RefreshLifetime, UserAgent());
        return await BuildAuthResponse(user, refreshToken, sessionId);
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

        return await BuildAuthResponse(user, rotated!.Value.Token, rotated.Value.SessionId);
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

        var pictureUpdatedAt = await ProfilePicture.GetUpdatedAtAsync(user.Id);
        return Ok(new UserResponse(user.Id, user.UserName, user.Email, pictureUpdatedAt?.Ticks));
    }

    [HttpGet("sessions")]
    public async Task<ActionResult<List<SessionResponse>>> Sessions()
    {
        if (!TryGetCurrentSession(out var current))
        {
            return Unauthorized();
        }

        return Ok(SessionList.Build(await RefreshToken.GetActiveAsync(User.GetUserId()), current));
    }

    [HttpDelete("sessions/{sessionId:guid}")]
    public async Task<ActionResult> EndSession(Guid sessionId)
    {
        if (!TryGetCurrentSession(out var current))
        {
            return Unauthorized();
        }

        if (sessionId == current)
        {
            return BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]> { ["sessionId"] = ["Use Log out to end this device's session."] }));
        }

        return await RefreshToken.RevokeSessionAsync(User.GetUserId(), sessionId) == 0 ? NotFound() : NoContent();
    }

    [HttpDelete("sessions")]
    public async Task<ActionResult> EndOtherSessions()
    {
        if (!TryGetCurrentSession(out var current))
        {
            return Unauthorized();
        }

        await RefreshToken.RevokeOtherSessionsAsync(User.GetUserId(), current);
        return NoContent();
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

    private bool TryGetCurrentSession(out Guid sessionId) =>
        Guid.TryParse(User.FindFirstValue(JwtRegisteredClaimNames.Sid), out sessionId);

    private string? UserAgent()
    {
        var agent = Request.Headers.UserAgent.ToString();
        return string.IsNullOrEmpty(agent) ? null : agent;
    }

    private async Task SendConfirmationEmail(KeepItSimpleUser user)
    {
        var token = await userManager.GenerateEmailConfirmationTokenAsync(user);
        await NotificationManager.EnqueueEmailConfirmationAsync(user, BuildLink("confirm-email", user, token));
    }

    private string BuildLink(string path, KeepItSimpleUser user, string token)
    {
        // Identity tokens contain '+' and '/', so they are Base64Url-encoded for the query string.
        var encoded = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));
        return $"{frontendOptions.Value.BaseUrl.TrimEnd('/')}/{path}?userId={Uri.EscapeDataString(user.Id)}&token={encoded}";
    }

    private static string? DecodeToken(string token)
    {
        try
        {
            return Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(token));
        }
        catch (FormatException)
        {
            return null;
        }
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
    private async Task<ActionResult> BuildAuthResponse(KeepItSimpleUser user, string refreshToken, Guid sessionId)
    {
        var roles = await userManager.GetRolesAsync(user);
        var (accessToken, _) = tokenManager.CreateToken(user, roles, sessionId);
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