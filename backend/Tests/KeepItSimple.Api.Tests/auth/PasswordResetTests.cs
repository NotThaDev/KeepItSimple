using System.Text;
using KeepItSimple.Api.Dtos.Auth;
using KeepItSimple.Api.Helpers;
using KeepItSimple.Api.Models;
using KeepItSimple.Api.Models.Auth;
using KeepItSimple.Api.Models.Notifications;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;

namespace KeepItSimple.Api.Tests.Auth;

// shortcut: the controller's success path revokes refresh tokens with ExecuteUpdate, which the in-memory provider lacks; it is checked against Postgres by hand.
public class PasswordResetTests
{
    private const string Password = "Tha1pwd!";
    private const string NewPassword = "Newp4ss!";

    private static string NewName() => $"user{Guid.NewGuid():N}";

    private static string NewEmail() => $"{Guid.NewGuid():N}@example.com";

    private static async Task<KeepItSimpleUser> NewUser(KeepItSimpleUserManager users, bool confirmed = true)
    {
        var user = new KeepItSimpleUser { UserName = NewName(), Email = NewEmail(), EmailConfirmed = confirmed };
        await users.CreateAsync(user, Password);
        return (await users.FindByIdAsync(user.Id))!;
    }

    private static async Task<string> EncodedResetToken(KeepItSimpleUserManager users, KeepItSimpleUser user)
    {
        var token = await users.GeneratePasswordResetTokenAsync(user);
        return WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));
    }

    [Fact]
    public async Task ResetPasswordAsync_with_valid_token_restarts_the_expiration_clock()
    {
        var (_, users) = RegisterTests.NewControllerWithUsers();
        var user = await NewUser(users);
        var token = await users.GeneratePasswordResetTokenAsync(user);

        var result = await users.ResetPasswordAsync(user, token, NewPassword);

        Assert.True(result.Succeeded);
        var reloaded = (await users.FindByIdAsync(user.Id))!;
        Assert.True(await users.CheckPasswordAsync(reloaded, NewPassword));
        Assert.True(DateTime.UtcNow - reloaded.PasswordChangedAt < TimeSpan.FromMinutes(1));
    }

    [Fact]
    public async Task ResetPasswordAsync_twice_with_same_token_fails_the_second_time()
    {
        var (_, users) = RegisterTests.NewControllerWithUsers();
        var user = await NewUser(users);
        var token = await users.GeneratePasswordResetTokenAsync(user);
        await users.ResetPasswordAsync(user, token, NewPassword);

        var result = await users.ResetPasswordAsync(user, token, "Other2pw!");

        Assert.False(result.Succeeded);
    }

    [Fact]
    public async Task ResetPassword_with_bad_token_keeps_the_password()
    {
        var (controller, users) = RegisterTests.NewControllerWithUsers();
        var user = await NewUser(users);
        var changedAt = user.PasswordChangedAt;

        var result = await controller.ResetPassword(new ResetPasswordRequest(user.Id, "not-a-token", NewPassword));

        Assert.IsType<BadRequestObjectResult>(result);
        var reloaded = (await users.FindByIdAsync(user.Id))!;
        Assert.True(await users.CheckPasswordAsync(reloaded, Password));
        Assert.Equal(changedAt, reloaded.PasswordChangedAt);
    }

    [Fact]
    public async Task ResetPassword_with_weak_password_returns_field_errors()
    {
        var (controller, users) = RegisterTests.NewControllerWithUsers();
        var user = await NewUser(users);
        var token = await EncodedResetToken(users, user);

        var result = await controller.ResetPassword(new ResetPasswordRequest(user.Id, token, "short"));

        var bad = Assert.IsType<BadRequestObjectResult>(result);
        var problem = Assert.IsType<ValidationProblemDetails>(bad.Value);
        Assert.True(problem.Errors.ContainsKey("newPassword"));
    }

    [Fact]
    public async Task ResetPassword_with_the_current_password_returns_field_error()
    {
        var (controller, users) = RegisterTests.NewControllerWithUsers();
        var user = await NewUser(users);
        var token = await EncodedResetToken(users, user);

        var result = await controller.ResetPassword(new ResetPasswordRequest(user.Id, token, Password));

        var problem = Assert.IsType<ValidationProblemDetails>(Assert.IsType<BadRequestObjectResult>(result).Value);
        Assert.True(problem.Errors.ContainsKey("newPassword"));
    }

    [Fact]
    public async Task ResetPassword_with_bad_token_does_not_reveal_the_current_password()
    {
        var (controller, users) = RegisterTests.NewControllerWithUsers();
        var user = await NewUser(users);

        var result = await controller.ResetPassword(new ResetPasswordRequest(user.Id, "not-a-token", Password));

        // Same plain 400 as any bad link, not the "different from the current one" field error.
        Assert.IsType<string>(Assert.IsType<BadRequestObjectResult>(result).Value);
    }

    [Fact]
    public async Task ForgotPassword_queues_a_reset_email()
    {
        var (controller, users) = RegisterTests.NewControllerWithUsers();
        var user = await NewUser(users);

        var result = await controller.ForgotPassword(new ForgotPasswordRequest(user.Email!));

        Assert.IsType<NoContentResult>(result);
        var notification = await KeepItSimpleContext.Context.WithDbContextAsync(db => db.Notifications.SingleAsync(n => n.UserId == user.Id));
        Assert.Contains("/reset-password?userId=", notification.Body);
    }

    [Fact]
    public async Task ForgotPassword_for_unknown_email_returns_no_content()
    {
        var (controller, _) = RegisterTests.NewControllerWithUsers();

        var result = await controller.ForgotPassword(new ForgotPasswordRequest(NewEmail()));

        Assert.IsType<NoContentResult>(result);
    }
}
