using KeepItSimple.Api.Models;
using KeepItSimple.Api.Models.Auth;
using Microsoft.AspNetCore.Identity;

namespace KeepItSimple.Api.Helpers;

/// <summary>
/// Setup the identity system for the application.
/// Here we are setting up all the settings and needed services for the identity system.
/// </summary>
public static class IdentitySetup
{
    private const string _passwordSection = "Identity:Password";
    private const string _frontendSection = "Frontend";
    public static IServiceCollection AddKeepItSimpleIdentity(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<PasswordExpirationSettings>(configuration.GetSection(_passwordSection));
        // Fails at startup instead of emailing links that point nowhere.
        services.AddOptions<FrontendSettings>()
            .Bind(configuration.GetSection(_frontendSection))
            .Validate(settings => Uri.TryCreate(settings.BaseUrl, UriKind.Absolute, out _), "Frontend:BaseUrl must be an absolute URL.")
            .ValidateOnStart();

        _ = services.AddIdentity<KeepItSimpleUser, IdentityRole>(options =>
            {
                configuration.GetSection(_passwordSection).Bind(options.Password);

                options.User.RequireUniqueEmail = true;
                options.Lockout.AllowedForNewUsers = true;
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            })
            .AddUserManager<KeepItSimpleUserManager>()
            .AddEntityFrameworkStores<KeepItSimpleDbContext>()
            .AddDefaultTokenProviders();

        return services;
    }
}
