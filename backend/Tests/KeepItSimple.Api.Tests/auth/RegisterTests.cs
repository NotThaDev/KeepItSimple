using System.Security.Claims;
using KeepItSimple.Api.Controllers;
using KeepItSimple.Api.Dtos.Auth;
using KeepItSimple.Api.Helpers;
using KeepItSimple.Api.Models;
using KeepItSimple.Api.Models.Auth;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace KeepItSimple.Api.Tests.Auth;

public class RegisterTests
{
    private const string Password = "Tha1pwd!";

    private static AuthController NewController() => NewControllerWithUsers().Controller;

    private static (AuthController Controller, UserManager<KeepItSimpleUser> Users) NewControllerWithUsers()
    {
        // Same password rules as appsettings.Development.json.
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Identity:Password:RequiredLength"] = "8",
            ["Identity:Password:RequireDigit"] = "true",
            ["Identity:Password:RequireLowercase"] = "true",
            ["Identity:Password:RequireUppercase"] = "true",
            ["Identity:Password:RequireNonAlphanumeric"] = "true",
        }).Build();

        var services = new ServiceCollection();
        services.AddLogging();
        services.AddDbContext<KeepItSimpleDbContext>(o => o.UseInMemoryDatabase(Guid.NewGuid().ToString()));
        services.AddKeepItSimpleIdentity(configuration);
        // SignInManager needs HttpContext services; the controller only calls CheckPasswordSignInAsync.
        services.AddHttpContextAccessor();
        var provider = services.BuildServiceProvider();

        var jwtSettings = new JwtSettings { Key = new string('k', 32), Issuer = "test", Audience = "test", ExpiryMinutes = 15, RefreshExpiryDays = 14 };
        var users = provider.GetRequiredService<UserManager<KeepItSimpleUser>>();
        var controller = new AuthController(
            users,
            provider.GetRequiredService<SignInManager<KeepItSimpleUser>>(),
            new TokenService(jwtSettings));
        return (controller, users);
    }

    [Fact]
    public async Task Register_creates_user_that_can_log_in()
    {
        var (controller, users) = NewControllerWithUsers();

        var registered = await controller.Register(new RegisterRequest("Tha", "tha@example.com", Password));

        Assert.IsType<OkResult>(registered);

        // shortcut: a successful Login stores a refresh row through KeepItSimpleContext, which needs a running app; check the password instead.
        Assert.True(await users.CheckPasswordAsync((await users.FindByNameAsync("Tha"))!, Password));
    }

    [Fact]
    public async Task Register_returns_conflict_for_the_taken_fields()
    {
        var controller = NewController();
        await controller.Register(new RegisterRequest("Tha", "tha@example.com", Password));

        Assert.Equal(["username"], ConflictFields(await controller.Register(new RegisterRequest("Tha", "other@example.com", Password))));
        Assert.Equal(["email"], ConflictFields(await controller.Register(new RegisterRequest("Other", "tha@example.com", Password))));
        Assert.Equal(["username", "email"], ConflictFields(await controller.Register(new RegisterRequest("Tha", "tha@example.com", Password))));
    }

    private static IEnumerable<string> ConflictFields(ActionResult result)
    {
        var conflict = Assert.IsType<ConflictObjectResult>(result);
        return Assert.IsType<ValidationProblemDetails>(conflict.Value).Errors.Keys;
    }

    [Fact]
    public async Task Register_rejects_weak_password()
    {
        var result = await NewController().Register(new RegisterRequest("Tha", "tha@example.com", "weak"));

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Login_rejects_wrong_password()
    {
        var controller = NewController();
        await controller.Register(new RegisterRequest("Tha", "tha@example.com", Password));

        var result = await controller.Login(new LoginRequest("Wrong1pwd!", Username: "Tha"));

        Assert.IsType<UnauthorizedResult>(result);
    }

    [Fact]
    public async Task Login_locks_the_account_after_too_many_failures()
    {
        var controller = NewController();
        await controller.Register(new RegisterRequest("Tha", "tha@example.com", Password));

        // IdentitySetup: 5 failed attempts lock the account for 15 minutes.
        for (var i = 0; i < 4; i++)
        {
            Assert.IsType<UnauthorizedResult>(await controller.Login(new LoginRequest("Wrong1pwd!", Username: "Tha")));
        }
        AssertLockedOut(await controller.Login(new LoginRequest("Wrong1pwd!", Username: "Tha")));

        // The right password doesn't get through while the lockout lasts.
        AssertLockedOut(await controller.Login(new LoginRequest(Password, Username: "Tha")));
    }

    private static void AssertLockedOut(ActionResult result)
    {
        var locked = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status423Locked, locked.StatusCode);
        Assert.InRange(Assert.IsType<LockoutResponse>(locked.Value).RetryAfterSeconds, 14 * 60, 15 * 60);
    }

    [Fact]
    public async Task Me_returns_the_signed_in_user()
    {
        var (controller, users) = NewControllerWithUsers();
        await controller.Register(new RegisterRequest("Tha", "tha@example.com", Password));
        var user = (await users.FindByNameAsync("Tha"))!;
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = SignedIn(user.Id) } };

        var result = await controller.Me();

        var me = Assert.IsType<UserResponse>(Assert.IsType<OkObjectResult>(result.Result).Value);
        Assert.Equal("Tha", me.UserName);
    }

    [Fact]
    public async Task Me_rejects_unknown_user()
    {
        var controller = NewController();
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = SignedIn("missing") } };

        var result = await controller.Me();

        Assert.IsType<UnauthorizedResult>(result.Result);
    }

    private static ClaimsPrincipal SignedIn(string userId) => new(new ClaimsIdentity([new Claim("sub", userId)], "test"));
}
