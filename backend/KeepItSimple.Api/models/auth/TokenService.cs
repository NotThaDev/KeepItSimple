using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using KeepItSimple.Api.Settings;
using Microsoft.IdentityModel.Tokens;

namespace KeepItSimple.Api.Models.Auth;

public class TokenService(JwtSettings settings)
{
    private readonly JwtSettings _settings = settings;

    public TimeSpan RefreshLifetime => TimeSpan.FromDays(_settings.RefreshExpiryDays);

    public const string AccessCookieName = "kis_access";

    public TimeSpan AccessLifetime => TimeSpan.FromMinutes(_settings.ExpiryMinutes);

    // New instance per call: Secure and MaxAge change per response, and CookieOptions is mutable.
    // Path "/" so the Next.js proxy sees both cookies on page requests.
    // MaxAge (not Expires): the browser counts it with its own clock, so a wrong client clock doesn't matter.
    // Response.Cookies.Delete sets its own past expiry, so deletes leave maxAge null.
    public CookieOptions AuthCookieOptions(bool secure, TimeSpan? maxAge = null) => new()
    {
        HttpOnly = true,
        SameSite = SameSiteMode.Lax,
        Secure = secure,
        Path = "/",
        MaxAge = maxAge,
    };

    public (string Token, DateTime ExpiresAt) CreateToken(KeepItSimpleUser user, IEnumerable<string> roles)
    {
        var expiresAt = DateTime.UtcNow.AddMinutes(_settings.ExpiryMinutes);

        // Claims are the pieces of information we store inside the token.
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Email, user.Email!),
            new(JwtRegisteredClaimNames.Name, user.UserName!),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        // Add role claims
        // right now we don't have roles in the system.
        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Key));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = expiresAt,
            Issuer = _settings.Issuer,
            Audience = _settings.Audience,
            SigningCredentials = credentials
        };

        var handler = new Microsoft.IdentityModel.JsonWebTokens.JsonWebTokenHandler();
        var token = handler.CreateToken(descriptor);

        return (token, expiresAt);
    }
}