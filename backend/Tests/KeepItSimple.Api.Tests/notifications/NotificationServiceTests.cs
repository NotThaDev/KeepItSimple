using KeepItSimple.Api.Helpers;
using KeepItSimple.Api.Models;
using KeepItSimple.Api.Models.Notifications;
using KeepItSimple.Api.Tests.Support;
using Microsoft.EntityFrameworkCore;

namespace KeepItSimple.Api.Tests.Notifications;

public class NotificationServiceTests
{
    [Fact]
    public async Task SendEmailConfirmationAsync_queues_a_pending_email()
    {
        var user = new KeepItSimpleUser { Id = TestApp.NewUserId(), UserName = "tha", Email = "tha@example.com" };

        await NotificationService.SendEmailConfirmationAsync(user, "https://x.test/confirm");

        var notification = await KeepItSimpleContext.Context.WithDbContextAsync(db =>
            db.Notifications.SingleAsync(n => n.UserId == user.Id));
        Assert.Equal(NotificationChannelType.Email, notification.Channel);
        Assert.Equal(NotificationStatus.Pending, notification.Status);
        Assert.Equal("tha@example.com", notification.Recipient);
        Assert.Contains("https://x.test/confirm", notification.Body);
    }

    [Fact]
    public async Task SendEmailConfirmationAsync_without_email_throws()
    {
        var user = new KeepItSimpleUser { Id = TestApp.NewUserId(), UserName = "tha", Email = null };

        await Assert.ThrowsAsync<ArgumentException>(() => NotificationService.SendEmailConfirmationAsync(user, "https://x.test/confirm"));
    }

    [Fact]
    public async Task SendAsync_with_unknown_channel_throws()
    {
        await Assert.ThrowsAsync<ArgumentException>(() =>
            NotificationService.SendAsync(TestApp.NewUserId(), (NotificationChannelType)0, "tha@example.com", "Subject", "Body"));
    }
}
