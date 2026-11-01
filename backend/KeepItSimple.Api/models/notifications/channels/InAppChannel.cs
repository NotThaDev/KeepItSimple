namespace KeepItSimple.Api.Models.Notifications.Channels;

public class InAppChannel : INotificationChannel
{
    public NotificationChannelType Type => NotificationChannelType.InApp;

    // Recipient is the user id; the row becomes visible to the UI's polling.
    public Task SendAsync(Notification notification, CancellationToken cancellationToken) =>
        InAppNotification.CreateAsync(notification.Recipient, notification.Subject, notification.Body);
}
