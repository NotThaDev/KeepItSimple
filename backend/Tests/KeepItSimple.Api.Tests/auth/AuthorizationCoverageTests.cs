using System.Reflection;
using KeepItSimple.Api.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KeepItSimple.Api.Tests.Auth;

public class AuthorizationCoverageTests
{
    // The fallback policy in AuthSetup protects everything else; only these may opt out.
    private static readonly string[] AllowedAnonymous =
    [
        "AuthController.Register",
        "AuthController.Login",
        "AuthController.ChangeExpiredPassword",
        "AuthController.Refresh",
        "AuthController.Logout",
    ];

    [Fact]
    public void Controllers_only_auth_entry_points_allow_anonymous()
    {
        var anonymous = typeof(AuthController).Assembly.GetTypes()
            .Where(type => typeof(ControllerBase).IsAssignableFrom(type) && !type.IsAbstract)
            .SelectMany(type => type.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly)
                .Where(method => type.IsDefined(typeof(AllowAnonymousAttribute)) || method.IsDefined(typeof(AllowAnonymousAttribute)))
                .Select(method => $"{type.Name}.{method.Name}"))
            .Order();

        Assert.Equal(AllowedAnonymous.Order(), anonymous);
    }
}
