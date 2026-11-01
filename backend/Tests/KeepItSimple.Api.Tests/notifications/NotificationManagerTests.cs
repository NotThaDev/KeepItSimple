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

    [Fact]
    public async Task EnqueueImportReminderAsync_queues_email_only_when_enabled_and_confirmed()
    {
        var emailed = new KeepItSimpleUser { Id = TestApp.NewUserId(), UserName = "tha", Email = "tha@example.com", EmailConfirmed = true };
        var quiet = new KeepItSimpleUser { Id = TestApp.NewUserId(), UserName = "bob", Email = "bob@example.com", EmailConfirmed = true };
        var setting = new ImportReminderSetting { Enabled = true, SendEmail = true };

        await NotificationManager.EnqueueImportReminderAsync(emailed, setting, "https://x.test/transactions");
        await NotificationManager.EnqueueImportReminderAsync(quiet, new ImportReminderSetting { Enabled = true, SendEmail = false }, "https://x.test/transactions");

        var emailedRows = await KeepItSimpleContext.Context.WithDbContextAsync(db =>
            db.Notifications.Where(n => n.UserId == emailed.Id).ToListAsync());
        var quietRows = await KeepItSimpleContext.Context.WithDbContextAsync(db =>
            db.Notifications.Where(n => n.UserId == quiet.Id).ToListAsync());
        Assert.Equal(2, emailedRows.Count);
        Assert.Single(emailedRows, n => n.Channel == NotificationChannelType.Email && n.Body.Contains("https://x.test/transactions"));
        Assert.Single(quietRows);
        Assert.Equal(NotificationChannelType.InApp, quietRows[0].Channel);
    }
}
