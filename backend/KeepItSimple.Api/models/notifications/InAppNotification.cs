using System.Text.Json.Serialization;
using KeepItSimple.Api.Dtos.Notification;
using KeepItSimple.Api.Helpers;
using Microsoft.EntityFrameworkCore;

namespace KeepItSimple.Api.Models.Notifications;

public class InAppNotification
{
    public const int TitleMaxLength = 200;
    public const int BodyMaxLength = 2000;

    public int Id { get; set; }
    [JsonIgnore]
    public string UserId { get; set; } = "";
    public string Title { get; set; } = "";
    public string Body { get; set; } = "";
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }

    public static Task CreateAsync(string userId, string title, string body)
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            dbContext.InAppNotifications.Add(new InAppNotification
            {
                UserId = userId,
                Title = Truncate(title, TitleMaxLength),
                Body = Truncate(body, BodyMaxLength),
                CreatedAt = DateTime.UtcNow,
            });
            await dbContext.SaveChangesAsync();
            return 0;
        });
    }

    // shortcut: newest 50 only, add paging when users keep more.
    public static Task<List<InAppNotification>> ListAsync(bool read, string userId)
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(dbContext =>
            dbContext.InAppNotifications.AsNoTracking()
                .Where(n => n.UserId == userId && (read ? n.ReadAt != null : n.ReadAt == null))
                .OrderByDescending(n => n.CreatedAt)
                .ThenByDescending(n => n.Id)
                .Take(50)
                .ToListAsync());
    }

    public static Task<UnreadSummaryResponse> GetUnreadSummaryAsync(string userId)
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            var unread = dbContext.InAppNotifications.AsNoTracking().Where(n => n.UserId == userId && n.ReadAt == null);
            return new UnreadSummaryResponse
            {
                Count = await unread.CountAsync(),
                LatestId = await unread.Select(n => (int?)n.Id).MaxAsync(),
            };
        });
    }

    public static Task<bool> MarkReadAsync(int id, string userId)
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(async dbContext =>
        {
            var notification = await dbContext.InAppNotifications.FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);
            if (notification == null)
            {
                return false;
            }

            if (notification.ReadAt == null)
            {
                notification.ReadAt = DateTime.UtcNow;
                await dbContext.SaveChangesAsync();
            }

            return true;
        });
    }

    public static Task<int> DeleteOlderThanAsync(DateTime cutoff)
    {
        return KeepItSimpleContext.Context.WithDbContextAsync(dbContext => dbContext.InAppNotifications
            .Where(n => n.CreatedAt < cutoff)
            .ExecuteDeleteAsync());
    }

    private static string Truncate(string value, int maxLength) => value.Length > maxLength ? value[..maxLength] : value;
}
