using KeepItSimple.Api.Helpers;
using KeepItSimple.Api.Models.Notifications;
using KeepItSimple.Api.Models.Notifications.Channels;
using KeepItSimple.Api.Tests.Support;
using Microsoft.EntityFrameworkCore;

namespace KeepItSimple.Api.Tests.Notifications;

public class InAppNotificationTests
{
    [Fact]
    public async Task InAppChannel_SendAsync_creates_an_unread_row()
    {
        var userId = TestApp.NewUserId();
        var notification = new Notification { Recipient = userId, Subject = "T", Body = "B", Channel = NotificationChannelType.InApp };

        await new InAppChannel().SendAsync(notification, CancellationToken.None);

        var list = await InAppNotification.ListAsync(false, userId);
        Assert.Single(list);
        Assert.Equal("T", list[0].Title);
    }

    [Fact]
    public async Task MarkReadAsync_moves_notification_to_read_list()
    {
        var userId = TestApp.NewUserId();
        await InAppNotification.CreateAsync(userId, "t", "b");
        var id = (await InAppNotification.ListAsync(false, userId)).Single().Id;

        Assert.True(await InAppNotification.MarkReadAsync(id, userId));

        Assert.Empty(await InAppNotification.ListAsync(false, userId));
        Assert.Single(await InAppNotification.ListAsync(true, userId));
    }

    [Fact]
    public async Task GetUnreadSummaryAsync_returns_count_and_latest_id()
    {
        var userId = TestApp.NewUserId();
        await InAppNotification.CreateAsync(userId, "first", "b");
        await InAppNotification.CreateAsync(userId, "second", "b");
        var ids = (await InAppNotification.ListAsync(false, userId)).Select(n => n.Id).OrderBy(id => id).ToList();

        var summary = await InAppNotification.GetUnreadSummaryAsync(userId);
        Assert.Equal(2, summary.Count);
        Assert.Equal(ids[1], summary.LatestId);

        await InAppNotification.MarkReadAsync(ids[1], userId);
        summary = await InAppNotification.GetUnreadSummaryAsync(userId);
        Assert.Equal(1, summary.Count);
        Assert.Equal(ids[0], summary.LatestId);
    }

    [Fact]
    public async Task DeleteOlderThanAsync_removes_only_old_rows()
    {
        var userId = TestApp.NewUserId();
        await KeepItSimpleContext.Context.WithDbContextAsync(async db =>
        {
            db.InAppNotifications.Add(new InAppNotification { UserId = userId, Title = "old", Body = "b", CreatedAt = DateTime.UtcNow.AddDays(-40) });
            await db.SaveChangesAsync();
            return 0;
        });
        await InAppNotification.CreateAsync(userId, "new", "b");

        await InAppNotification.DeleteOlderThanAsync(DateTime.UtcNow.AddDays(-30));

        var remaining = await InAppNotification.ListAsync(false, userId);
        Assert.Single(remaining);
        Assert.Equal("new", remaining[0].Title);
    }

    [Fact]
    public async Task EnqueueInAppAsync_queues_pending_inapp_row()
    {
        var userId = TestApp.NewUserId();

        await NotificationManager.EnqueueInAppAsync(userId, "Title", "Body");

        var notification = await KeepItSimpleContext.Context.WithDbContextAsync(db =>
            db.Notifications.SingleAsync(n => n.UserId == userId));
        Assert.Equal(NotificationChannelType.InApp, notification.Channel);
        Assert.Equal(NotificationStatus.Pending, notification.Status);
        Assert.Equal(userId, notification.Recipient);
    }
}
