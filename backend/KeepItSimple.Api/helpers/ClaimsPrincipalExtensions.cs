using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace KeepItSimple.Api.Helpers;

public static class ClaimsPrincipalExtensions
{
    // The fallback policy only lets authenticated users in, and every access token carries "sub" (MapInboundClaims = false keeps the name).
    public static string GetUserId(this ClaimsPrincipal user) =>
        user.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? throw new InvalidOperationException("The signed-in user has no sub claim.");
}
