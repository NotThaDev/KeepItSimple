using System.Text.Json.Serialization;
using KeepItSimple.Api.Helpers;
using Microsoft.EntityFrameworkCore;

namespace KeepItSimple.Api.Models.Notifications;

public class Notification
{
    public int Id { get; set; }
    [JsonIgnore]
    public string? UserId { get; set; }
    public NotificationChannelType Channel { get; set; }
    // Where the channel delivers: an email address for Email, later a phone number, device token or user id.
    // Captured when queued, so a later change on the user does not redirect it.
    public string Recipient { get; set; } = "";
    public string Subject { get; set; } = "";
    public string Body { get; set; } = "";
    public NotificationStatus Status { get; set; }
    public int Attempts { get; set; }
    public string? LastError { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime NextAttemptAt { get; set; }
    public DateTime? SentAt { get; set; }

    public static Task EnqueueAsync(Notification notification)
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            notification.Id = 0;
            notification.Status = NotificationStatus.Pending;
            notification.Attempts = 0;
            notification.LastError = null;
            notification.SentAt = null;
            notification.CreatedAt = notification.NextAttemptAt = DateTime.UtcNow;
            dbContext.Notifications.Add(notification);
            await dbContext.SaveChangesAsync();
            return 0;
        });
    }

    // shortcut: assumes a single API instance; with several, claim rows with FOR UPDATE SKIP LOCKED.
    public static Task<List<Notification>> GetDueAsync(int batchSize)
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(dbContext =>
        {
            var now = DateTime.UtcNow;
            return dbContext.Notifications.AsNoTracking()
                .Where(n => n.Status == NotificationStatus.Pending && n.NextAttemptAt <= now)
                .OrderBy(n => n.Id)
                .Take(batchSize)
                .ToListAsync();
        });
    }

    public static Task MarkSentAsync(int id)
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            var notification = await dbContext.Notifications.FirstOrDefaultAsync(n => n.Id == id);
            if (notification == null)
            {
                return 0;
            }

            notification.Status = NotificationStatus.Sent;
            notification.SentAt = DateTime.UtcNow;
            notification.Attempts++;
            notification.LastError = null;
            // The body can hold live tokens (e.g. confirmation links); it is not needed once delivered.
            notification.Body = "";
            await dbContext.SaveChangesAsync();
            return 0;
        });
    }

    public static Task MarkFailedAsync(int id, string error, int maxAttempts, TimeSpan retryBase)
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            var notification = await dbContext.Notifications.FirstOrDefaultAsync(n => n.Id == id);
            if (notification == null)
            {
                return 0;
            }

            notification.Attempts++;
            notification.LastError = error.Length > 2000 ? error[..2000] : error;
            if (notification.Attempts >= maxAttempts)
            {
                notification.Status = NotificationStatus.Failed;
            }
            else
            {
                notification.NextAttemptAt = DateTime.UtcNow + TimeSpan.FromTicks((long)(retryBase.Ticks * Math.Pow(2, notification.Attempts - 1)));
            }

            await dbContext.SaveChangesAsync();
            return 0;
        });
    }
}
