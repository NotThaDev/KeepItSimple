using System.Security.Claims;
using KeepItSimple.Api.Controllers;
using KeepItSimple.Api.Helpers;
using KeepItSimple.Api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace KeepItSimple.Api.Tests.Ownership;

public class OwnershipBackfillControllerTests
{
    [Fact]
    public async Task AssignOwner_other_user_is_forbidden()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddDbContext<KeepItSimpleDbContext>(o => o.UseInMemoryDatabase(Guid.NewGuid().ToString()));
        services.AddKeepItSimpleIdentity(new ConfigurationBuilder().Build());
        var users = services.BuildServiceProvider().GetRequiredService<UserManager<KeepItSimpleUser>>();
        var user = new KeepItSimpleUser { UserName = "Someone", Email = "someone@example.com" };
        await users.CreateAsync(user, "Tha1pwd!x");

        var controller = new OwnershipBackfillController(users)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity([new Claim("sub", user.Id)], "test")),
                },
            },
        };

        // Only the Forbid path: the allowed path would assign the shared test database's unowned rows.
        Assert.IsType<ForbidResult>((await controller.AssignOwner()).Result);
    }
}
