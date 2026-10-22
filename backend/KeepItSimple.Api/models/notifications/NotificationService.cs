namespace KeepItSimple.Api.Models.Notifications;

// The single entry point features call: it only queues; NotificationDispatcher delivers in the background.
public static class NotificationService
{
    public static Task SendAsync(string? userId, NotificationChannelType channel, string recipient, string subject, string body)
    {
        if (!Enum.IsDefined(channel))
        {
            throw new ArgumentException($"Unknown notification channel {channel}.", nameof(channel));
        }

        if (string.IsNullOrWhiteSpace(recipient))
        {
            throw new ArgumentException("Recipient is required.", nameof(recipient));
        }

        return Notification.EnqueueAsync(new Notification
        {
            UserId = userId,
            Channel = channel,
            Recipient = recipient,
            Subject = subject,
            Body = body,
        });
    }
}
