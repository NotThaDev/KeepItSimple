using KeepItSimple.Api.Models.Auth;
using KeepItSimple.Api.Models;
using KeepItSimple.Api.Settings;
using Microsoft.AspNetCore.Identity;

namespace KeepItSimple.Api.Helpers;

/// <summary>
/// Setup the identity system for the application.
/// Here we are setting up all the settings and needed services for the identity system.
/// </summary>
public static class IdentitySetup
{
    private const string _passwordSection = "Identity:Password";
    public static IServiceCollection AddKeepItSimpleIdentity(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<PasswordExpirationSettings>(configuration.GetSection(_passwordSection));

        _ = services.AddIdentity<KeepItSimpleUser, IdentityRole>(options =>
            {
                configuration.GetSection(_passwordSection).Bind(options.Password);

                options.User.RequireUniqueEmail = true;
                options.Lockout.AllowedForNewUsers = true;
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            })
            .AddUserManager<KeepItSimpleUserManager>()
            .AddEntityFrameworkStores<KeepItSimpleDbContext>();

        return services;
    }
}
