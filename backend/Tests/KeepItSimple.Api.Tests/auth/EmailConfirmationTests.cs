using System.Text;
using KeepItSimple.Api.Dtos.Auth;
using KeepItSimple.Api.Helpers;
using KeepItSimple.Api.Models;
using KeepItSimple.Api.Models.Notifications;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;

namespace KeepItSimple.Api.Tests.Auth;

public class EmailConfirmationTests
{
    private const string Password = "Tha1pwd!";

    private static string NewName() => $"user{Guid.NewGuid():N}";

    private static string NewEmail() => $"{Guid.NewGuid():N}@example.com";

    [Fact]
    public async Task Register_queues_a_confirmation_email()
    {
        var (controller, users) = RegisterTests.NewControllerWithUsers();
        var email = NewEmail();
        await controller.Register(new RegisterRequest(NewName(), email, Password));
        var user = (await users.FindByEmailAsync(email))!;

        var notification = await KeepItSimpleContext.Context.WithDbContextAsync(db => db.Notifications.SingleAsync(n => n.UserId == user.Id));

        Assert.Equal(email, notification.Recipient);
        Assert.Contains("/confirm-email?userId=", notification.Body);
    }

    [Fact]
    public async Task ConfirmEmail_with_valid_token_confirms_the_user()
    {
        var (controller, users) = RegisterTests.NewControllerWithUsers();
        var name = NewName();
        await controller.Register(new RegisterRequest(name, NewEmail(), Password));
        var user = (await users.FindByNameAsync(name))!;
        var token = await users.GenerateEmailConfirmationTokenAsync(user);
        var encoded = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));

        var result = await controller.ConfirmEmail(new ConfirmEmailRequest(user.Id, encoded));

        Assert.IsType<NoContentResult>(result);
        Assert.True((await users.FindByIdAsync(user.Id))!.EmailConfirmed);
    }

    [Fact]
    public async Task ConfirmEmail_with_bad_token_returns_bad_request()
    {
        var (controller, users) = RegisterTests.NewControllerWithUsers();
        var name = NewName();
        await controller.Register(new RegisterRequest(name, NewEmail(), Password));
        var user = (await users.FindByNameAsync(name))!;

        var result = await controller.ConfirmEmail(new ConfirmEmailRequest(user.Id, "not-a-token"));

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Login_unconfirmed_with_right_password_returns_email_not_confirmed()
    {
        var (controller, _) = RegisterTests.NewControllerWithUsers();
        var name = NewName();
        await controller.Register(new RegisterRequest(name, NewEmail(), Password));

        var result = await controller.Login(new LoginRequest(Password, Username: name));

        var error = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status403Forbidden, error.StatusCode);
        Assert.Equal(new LoginErrorResponse("email_not_confirmed"), error.Value);
    }

    [Fact]
    public async Task Login_unconfirmed_with_wrong_password_returns_unauthorized()
    {
        var (controller, _) = RegisterTests.NewControllerWithUsers();
        var name = NewName();
        await controller.Register(new RegisterRequest(name, NewEmail(), Password));

        var result = await controller.Login(new LoginRequest("Wrong1pwd!", Username: name));

        Assert.IsType<UnauthorizedResult>(result);
    }

    [Fact]
    public async Task ResendConfirmation_for_unknown_user_returns_no_content()
    {
        var (controller, _) = RegisterTests.NewControllerWithUsers();

        var result = await controller.ResendConfirmation(new ResendConfirmationRequest(NewName()));

        Assert.IsType<NoContentResult>(result);
    }
}
