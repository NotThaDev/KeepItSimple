using System.IdentityModel.Tokens.Jwt;
using System.Text;
using KeepItSimple.Api.Models.Auth;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;

namespace KeepItSimple.Api.Helpers;


public static class AuthSetup
{
    private const string _jwtSettingsSection = "JwtSettings";
    public static IServiceCollection AddKeepItSimpleAuth(this IServiceCollection services, IConfiguration configuration)
    {
        var jwtSettings = configuration.GetSection(_jwtSettingsSection).Get<JwtSettings>() ?? throw new InvalidOperationException("JWT settings are not configured.");
        ValidateJwtSettings(jwtSettings);

        services.AddSingleton(jwtSettings);
        services.AddScoped<TokenService>();

        services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                // Keep the claim names exactly as they appear in the token (no surprise remapping).
                options.MapInboundClaims = false;
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        if (string.IsNullOrEmpty(context.Request.Headers.Authorization))
                        {
                            context.Token = context.Request.Cookies[TokenService.AccessCookieName];
                        }

                        return Task.CompletedTask;
                    },
                };
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtSettings.Issuer,
                    ValidAudience = jwtSettings.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Key)),
                    ClockSkew = TimeSpan.Zero,
                    NameClaimType = JwtRegisteredClaimNames.Name,
                    RoleClaimType = "role"
                };
            });

        // Every endpoint needs a signed-in user unless it opts out with [AllowAnonymous].
        services.AddAuthorizationBuilder()
            .SetFallbackPolicy(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build());
        return services;
    }

    private static void ValidateJwtSettings(JwtSettings jwtSettings)
    {
        if (string.IsNullOrEmpty(jwtSettings.Key))
        {
            throw new InvalidOperationException("JWT Key is not configured.");
        }

        if (string.IsNullOrEmpty(jwtSettings.Issuer))
        {
            throw new InvalidOperationException("JWT Issuer is not configured.");
        }

        if (string.IsNullOrEmpty(jwtSettings.Audience))
        {
            throw new InvalidOperationException("JWT Audience is not configured.");
        }

        if (jwtSettings.ExpiryMinutes <= 0)
        {
            throw new InvalidOperationException("JWT ExpiryMinutes must be greater than zero.");
        }

        if (jwtSettings.RefreshExpiryDays <= 0)
        {
            throw new InvalidOperationException("JWT RefreshExpiryDays must be greater than zero.");
        }
    }

}
