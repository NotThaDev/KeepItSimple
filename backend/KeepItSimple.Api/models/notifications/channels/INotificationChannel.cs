using KeepItSimple.Api.Models.Notifications;

namespace KeepItSimple.Api.Models.Notifications.Channels;

public interface INotificationChannel
{
    NotificationChannelType Type { get; }
    Task SendAsync(Notification notification, CancellationToken cancellationToken);
}
