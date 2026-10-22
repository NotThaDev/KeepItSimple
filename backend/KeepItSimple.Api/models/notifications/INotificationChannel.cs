namespace KeepItSimple.Api.Models.Notifications;

public interface INotificationChannel
{
    NotificationChannelType Type { get; }
    Task SendAsync(Notification notification, CancellationToken cancellationToken);
}
