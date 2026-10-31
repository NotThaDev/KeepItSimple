using KeepItSimple.Api.Helpers;
using KeepItSimple.Api.Models;
using KeepItSimple.Api.Models.Notifications;
using KeepItSimple.Api.Tests.Support;
using Microsoft.EntityFrameworkCore;

namespace KeepItSimple.Api.Tests.Notifications;

public class NotificationManagerTests
{
    [Fact]
    public async Task EnqueueEmailConfirmationAsync_queues_a_pending_email()
    {
        var user = new KeepItSimpleUser { Id = TestApp.NewUserId(), UserName = "tha", Email = "tha@example.com" };

        await NotificationManager.EnqueueEmailConfirmationAsync(user, "https://x.test/confirm");

        var notification = await KeepItSimpleContext.Context.WithDbContextAsync(db =>
            db.Notifications.SingleAsync(n => n.UserId == user.Id));
        Assert.Equal(NotificationChannelType.Email, notification.Channel);
        Assert.Equal(NotificationStatus.Pending, notification.Status);
        Assert.Equal("tha@example.com", notification.Recipient);
        Assert.Contains("https://x.test/confirm", notification.Body);
    }

    [Fact]
    public async Task EnqueueEmailConfirmationAsync_without_email_throws()
    {
        var user = new KeepItSimpleUser { Id = TestApp.NewUserId(), UserName = "tha", Email = null };

        await Assert.ThrowsAsync<ArgumentException>(() => NotificationManager.EnqueueEmailConfirmationAsync(user, "https://x.test/confirm"));
    }

    [Fact]
    public async Task EnqueueAsync_with_unknown_channel_throws()
    {
        await Assert.ThrowsAsync<ArgumentException>(() =>
            NotificationManager.EnqueueAsync(TestApp.NewUserId(), (NotificationChannelType)0, "tha@example.com", "Subject", "Body"));
    }
}
