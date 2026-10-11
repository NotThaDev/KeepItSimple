using KeepItSimple.Api.Controllers;
using KeepItSimple.Api.Dtos.Auth;
using KeepItSimple.Api.Helpers;
using KeepItSimple.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace KeepItSimple.Api.Tests.Auth;

public class RegisterTests
{
    private const string Password = "Tha1pwd!";

    private static AuthController NewController()
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

        return new AuthController(
            provider.GetRequiredService<UserManager<KeepItSimpleUser>>(),
            provider.GetRequiredService<SignInManager<KeepItSimpleUser>>());
    }

    [Fact]
    public async Task Register_creates_user_that_can_log_in()
    {
        var controller = NewController();

        var registered = await controller.Register(new RegisterRequest("Tha", "tha@example.com", Password));

        var user = Assert.IsType<UserResponse>(Assert.IsType<OkObjectResult>(registered.Result).Value);
        Assert.Equal("Tha", user.UserName);

        var loggedIn = await controller.Login(new LoginRequest(Password, Username: "Tha"));
        Assert.IsType<OkObjectResult>(loggedIn.Result);
    }

    [Fact]
    public async Task Register_rejects_duplicate_username_and_email()
    {
        var controller = NewController();
        await controller.Register(new RegisterRequest("Tha", "tha@example.com", Password));

        var sameName = await controller.Register(new RegisterRequest("Tha", "other@example.com", Password));
        var sameEmail = await controller.Register(new RegisterRequest("Other", "tha@example.com", Password));

        Assert.IsType<BadRequestObjectResult>(sameName.Result);
        Assert.IsType<BadRequestObjectResult>(sameEmail.Result);
    }

    [Fact]
    public async Task Register_rejects_weak_password()
    {
        var result = await NewController().Register(new RegisterRequest("Tha", "tha@example.com", "weak"));

        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task Login_rejects_wrong_password()
    {
        var controller = NewController();
        await controller.Register(new RegisterRequest("Tha", "tha@example.com", Password));

        var result = await controller.Login(new LoginRequest("Wrong1pwd!", Username: "Tha"));

        Assert.IsType<UnauthorizedResult>(result.Result);
    }
}
