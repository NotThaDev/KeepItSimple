using KeepItSimple.Api.Models;
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
        _ = services.AddIdentity<KeepItSimpleUser, IdentityRole>(options => configuration.GetSection(_passwordSection).Bind(options.Password))
            .AddEntityFrameworkStores<KeepItSimpleDbContext>();

        return services;
    }
}
